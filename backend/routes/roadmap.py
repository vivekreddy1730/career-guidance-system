"""
routes/roadmap.py — Career roadmap generation and management.
GET  /api/roadmap          → fetch existing or generate new roadmap
POST /api/roadmap/generate → explicitly generate roadmap for career
PUT  /api/roadmap/milestone/<id>/complete → mark milestone complete
"""
import json
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.student import Student
from models.roadmap import Roadmap, RoadmapMilestone
from services.skill_gap import analyze_gap
from services.recommendation import get_full_recommendation
from services.roadmap_generator import generate_roadmap

roadmap_bp = Blueprint("roadmap", __name__)
logger = logging.getLogger(__name__)


def _save_roadmap(student_id: int, roadmap_data: dict) -> Roadmap:
    """Persist generated roadmap to DB."""
    # Delete existing roadmap for same career
    Roadmap.query.filter_by(
        student_id=student_id, career_title=roadmap_data["career_title"]
    ).delete()

    roadmap = Roadmap(
        student_id=student_id,
        career_title=roadmap_data["career_title"],
        total_months=roadmap_data["total_months"],
        summary=roadmap_data["summary"],
    )
    db.session.add(roadmap)
    db.session.flush()

    for m in roadmap_data["milestones"]:
        milestone = RoadmapMilestone(
            roadmap_id=roadmap.id,
            month=m["month"],
            title=m["title"],
            description=m.get("description", ""),
            tasks=json.dumps(m.get("tasks", [])),
            courses=json.dumps(m.get("courses", [])),
            certifications=json.dumps(m.get("certifications", [])),
            is_completed=False,
        )
        db.session.add(milestone)

    db.session.commit()
    return roadmap


@roadmap_bp.route("", methods=["GET"])
@jwt_required()
def get_roadmap():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    career_title = request.args.get("career")

    query = Roadmap.query.filter_by(student_id=student_id)
    if career_title:
        query = query.filter_by(career_title=career_title)

    roadmap = query.order_by(Roadmap.generated_at.desc()).first()

    if roadmap:
        return jsonify({"roadmap": roadmap.to_dict()}), 200

    # Auto-generate if none exists
    return jsonify({"roadmap": None, "message": "No roadmap found. POST /api/roadmap/generate to create one."}), 200


@roadmap_bp.route("/generate", methods=["POST"])
@jwt_required()
def generate():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    data = request.get_json(silent=True) or {}
    career_title = data.get("career")

    if not career_title:
        # Auto-predict
        try:
            from ml.predict import predict_career
            from routes.career import _build_student_feature_dict
            feature_dict = _build_student_feature_dict(student)
            predictions = predict_career(feature_dict, top_k=1)
            career_title = predictions[0]["career"] if predictions else None
        except Exception as e:
            logger.error("Auto-predict failed: %s", e)

    if not career_title:
        return jsonify({"error": "career is required or run career prediction first"}), 400

    try:
        gap = analyze_gap(student_id, career_title)
        recommendations = get_full_recommendation(career_title, gap)

        api_key = current_app.config.get("OPENAI_API_KEY", "")
        roadmap_data = generate_roadmap(
            student_id=student_id,
            student_name=student.name or "Student",
            career_title=career_title,
            gap_analysis=gap,
            recommendations=recommendations,
            openai_api_key=api_key,
        )

        roadmap = _save_roadmap(student_id, roadmap_data)

        return jsonify({
            "message": "Roadmap generated successfully",
            "roadmap": roadmap.to_dict(),
        }), 201

    except Exception as e:
        logger.error("Roadmap generation failed: %s", e, exc_info=True)
        return jsonify({"error": "Roadmap generation failed", "detail": str(e)}), 500


@roadmap_bp.route("/milestone/<int:milestone_id>/complete", methods=["PUT"])
@jwt_required()
def complete_milestone(milestone_id):
    student_id = int(get_jwt_identity())

    milestone = (
        db.session.query(RoadmapMilestone)
        .join(Roadmap, RoadmapMilestone.roadmap_id == Roadmap.id)
        .filter(
            RoadmapMilestone.id == milestone_id,
            Roadmap.student_id == student_id,
        )
        .first()
    )

    if not milestone:
        return jsonify({"error": "Milestone not found"}), 404

    data = request.get_json(silent=True) or {}
    milestone.is_completed = data.get("is_completed", True)
    db.session.commit()

    return jsonify({
        "message": "Milestone updated",
        "milestone_id": milestone_id,
        "is_completed": milestone.is_completed,
    }), 200
