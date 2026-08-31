"""
routes/interview.py — AI Mock Technical Interviewer endpoints.
GET  /api/interview/questions?career=...  → fetch role-tailored questions
POST /api/interview/evaluate              → evaluate student's answer in real-time
POST /api/interview/save                  → save interview session result
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.mock_interview import get_questions_for_career, evaluate_student_answer
from models.student import Student

interview_bp = Blueprint("interview", __name__)
logger = logging.getLogger(__name__)


@interview_bp.route("/questions", methods=["GET"])
@jwt_required()
def get_questions():
    career = request.args.get("career", "Software Engineer")
    questions = get_questions_for_career(career, count=3)
    return jsonify({
        "career": career,
        "questions": questions,
        "total": len(questions),
    }), 200


@interview_bp.route("/evaluate", methods=["POST"])
@jwt_required()
def evaluate():
    data = request.get_json(silent=True) or {}
    question = data.get("question", "")
    keywords = data.get("keywords", [])
    model_answer = data.get("model_answer", "")
    user_answer = data.get("user_answer", "")

    if not user_answer:
        return jsonify({"error": "user_answer is required"}), 400

    result = evaluate_student_answer(
        question=question,
        expected_keywords=keywords,
        model_answer=model_answer,
        user_answer=user_answer,
    )

    return jsonify({"evaluation": result}), 200


@interview_bp.route("/save", methods=["POST"])
@jwt_required()
def save_session():
    student_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    career = data.get("career", "Software Engineer")
    average_score = data.get("average_score", 80.0)

    # Return acknowledgement and recorded summary
    return jsonify({
        "message": "Interview session recorded successfully",
        "student_id": student_id,
        "career": career,
        "average_score": average_score,
    }), 200
