"""
routes/assessment.py — Aptitude + technical assessment endpoints.
GET  /api/assessment/questions → paginated question bank
POST /api/assessment/start     → create assessment session
POST /api/assessment/submit    → submit answers, compute score report
GET  /api/assessment/report    → fetch latest completed report
"""
import json
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.assessment import Assessment, AssessmentQuestion, AssessmentResponse
from models.skill import Skill, StudentSkill

assessment_bp = Blueprint("assessment", __name__)
logger = logging.getLogger(__name__)


@assessment_bp.route("/questions", methods=["GET"])
@jwt_required()
def get_questions():
    section = request.args.get("section")  # aptitude | technical | None (all)
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))

    query = AssessmentQuestion.query
    if section:
        query = query.filter_by(section=section)

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    questions_out = []
    for q in paginated.items:
        questions_out.append({
            "id": q.id,
            "section": q.section,
            "sub_section": q.sub_section,
            "question_text": q.question_text,
            "options": json.loads(q.options),
            "difficulty": q.difficulty,
            "skill_tag": q.skill_tag,
            # NOTE: correct_index is NOT returned to frontend
        })

    return jsonify({
        "questions": questions_out,
        "total": paginated.total,
        "page": page,
        "pages": paginated.pages,
    }), 200


@assessment_bp.route("/start", methods=["POST"])
@jwt_required()
def start_assessment():
    student_id = int(get_jwt_identity())

    # Check for existing in-progress assessment
    existing = Assessment.query.filter_by(
        student_id=student_id, status="in_progress"
    ).first()
    if existing:
        return jsonify({"assessment_id": existing.id, "message": "Resuming existing assessment"}), 200

    assessment = Assessment(student_id=student_id, status="in_progress")
    db.session.add(assessment)
    db.session.commit()
    return jsonify({"assessment_id": assessment.id, "message": "Assessment started"}), 201


@assessment_bp.route("/submit", methods=["POST"])
@jwt_required()
def submit_assessment():
    """
    Body: {
        "assessment_id": int,
        "responses": [{"question_id": int, "selected_index": int}, ...]
    }
    """
    student_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    assessment_id = data.get("assessment_id")
    responses_data = data.get("responses", [])

    if not assessment_id or not responses_data:
        return jsonify({"error": "assessment_id and responses are required"}), 400

    assessment = Assessment.query.filter_by(
        id=assessment_id, student_id=student_id
    ).first()
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404

    if assessment.status == "completed":
        return jsonify({"error": "Assessment already completed", "report": assessment.to_dict()}), 400

    # Score responses
    skill_scores: dict = {}   # skill_tag → [correct, total]

    for resp in responses_data:
        q_id = resp.get("question_id")
        selected = resp.get("selected_index")

        question = AssessmentQuestion.query.get(q_id)
        if not question:
            continue

        is_correct = (selected == question.correct_index) if selected is not None else False

        # Record response
        existing_resp = AssessmentResponse.query.filter_by(
            assessment_id=assessment_id, question_id=q_id
        ).first()
        if existing_resp:
            existing_resp.selected_index = selected
            existing_resp.is_correct = is_correct
        else:
            ar = AssessmentResponse(
                assessment_id=assessment_id,
                question_id=q_id,
                selected_index=selected,
                is_correct=is_correct,
            )
            db.session.add(ar)

        # Accumulate skill scores
        tag = question.skill_tag or question.sub_section or question.section
        if tag not in skill_scores:
            skill_scores[tag] = [0, 0]
        skill_scores[tag][1] += 1
        if is_correct:
            skill_scores[tag][0] += 1

    # Build score report: skill → 0-100
    score_report = {
        tag: round(correct / total * 100)
        for tag, (correct, total) in skill_scores.items()
        if total > 0
    }

    total_correct = sum(v[0] for v in skill_scores.values())
    total_questions = sum(v[1] for v in skill_scores.values())
    total_score = round(total_correct / max(total_questions, 1) * 100, 1)

    assessment.score_report = json.dumps(score_report)
    assessment.total_score = total_score
    assessment.status = "completed"
    assessment.completed_at = datetime.utcnow()

    # Update student skills from assessment
    for skill_name, score in score_report.items():
        skill = Skill.query.filter(Skill.name.ilike(skill_name)).first()
        if not skill:
            skill = Skill(name=skill_name, category="assessed")
            db.session.add(skill)
            db.session.flush()

        existing_ss = StudentSkill.query.filter_by(
            student_id=student_id, skill_id=skill.id, source="assessed"
        ).first()
        if existing_ss:
            existing_ss.proficiency = score
        else:
            db.session.add(StudentSkill(
                student_id=student_id,
                skill_id=skill.id,
                proficiency=score,
                source="assessed",
            ))

    db.session.commit()

    return jsonify({
        "message": "Assessment submitted successfully",
        "report": assessment.to_dict(),
        "score_report": score_report,
        "total_score": total_score,
    }), 200


@assessment_bp.route("/report", methods=["GET"])
@jwt_required()
def get_report():
    student_id = int(get_jwt_identity())
    assessment = (
        Assessment.query.filter_by(student_id=student_id, status="completed")
        .order_by(Assessment.completed_at.desc())
        .first()
    )
    if not assessment:
        return jsonify({"error": "No completed assessment found"}), 404

    return jsonify({"report": assessment.to_dict()}), 200
