"""
routes/assessment.py — Aptitude + technical assessment endpoints.
GET  /api/assessment/questions → balanced, randomized question set
POST /api/assessment/start     → create assessment session
POST /api/assessment/submit    → submit answers, compute score report
GET  /api/assessment/report    → fetch latest completed report
"""
import json
import random
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
    randomize = request.args.get("randomize", "true").lower() == "true"

    if section:
        items = AssessmentQuestion.query.filter_by(section=section).all()
        if randomize:
            random.shuffle(items)
        selected = items[:25]
    else:
        # Balanced sampling: 8 aptitude + 16 technical covering multiple domains
        apt_items = AssessmentQuestion.query.filter_by(section="aptitude").all()
        tech_items = AssessmentQuestion.query.filter_by(section="technical").all()

        if randomize:
            random.shuffle(apt_items)
            random.shuffle(tech_items)

        # Select a diverse set: up to 8 aptitude and up to 16 technical
        selected_apt = apt_items[:8] if len(apt_items) >= 8 else apt_items
        selected_tech = tech_items[:16] if len(tech_items) >= 16 else tech_items
        selected = selected_apt + selected_tech

    questions_out = []
    for q in selected:
        try:
            opts = json.loads(q.options) if isinstance(q.options, str) else q.options
        except Exception:
            opts = ["Option A", "Option B", "Option C", "Option D"]

        questions_out.append({
            "id": q.id,
            "section": q.section,
            "sub_section": q.sub_section,
            "question_text": q.question_text,
            "options": opts,
            "difficulty": q.difficulty,
            "skill_tag": q.skill_tag,
            # correct_index is kept secure on server
        })

    return jsonify({
        "questions": questions_out,
        "total": len(questions_out),
        "page": 1,
        "pages": 1,
    }), 200


@assessment_bp.route("/start", methods=["POST"])
@jwt_required()
def start_assessment():
    student_id = int(get_jwt_identity())

    # Create a fresh assessment attempt
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

        # Accumulate skill scores by specific skill_tag
        tag = question.skill_tag or question.sub_section or question.section
        if tag not in skill_scores:
            skill_scores[tag] = [0, 0]
        skill_scores[tag][1] += 1
        if is_correct:
            skill_scores[tag][0] += 1

    # Build score report: skill → 0-100%
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

    # Update student skills in DB from assessment performance
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
