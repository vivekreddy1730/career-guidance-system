"""
routes/career.py — Career prediction, gap analysis, and recommendations.
POST /api/career/predict   → ML career prediction
GET  /api/career/gap       → skill gap vs. predicted/target career
GET  /api/career/recommend → course + cert recommendations
GET  /api/career/list      → all available careers
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.student import Student
from models.career import Career
from models.assessment import Assessment
from models.skill import StudentSkill, Skill
from services.skill_gap import analyze_gap
from services.recommendation import get_full_recommendation

career_bp = Blueprint("career", __name__)
logger = logging.getLogger(__name__)


def _build_student_feature_dict(student: Student) -> dict:
    """Build a comprehensive feature dict from student profile, skills, interests, and assessment."""
    features = {}

    # Basic academic metrics
    features["cgpa"] = float(student.cgpa or 8.0)
    features["year"] = int(student.year or 4)
    features["branch"] = student.branch or "Computer Science"

    # Gather student skills & interests
    skill_names = [ss.skill.name.lower() for ss in student.skills if ss.skill]
    interests = [str(i).lower() for i in (student.get_interests() or [])]

    # Map to domain Major aligned with dataset
    if any(k in interests or k in skill_names for k in ["data science", "data analytics", "tableau", "statistics", "pandas", "numpy"]):
        features["Major"] = "Data Science"
    elif any(k in interests or k in skill_names for k in ["ai/ml", "machine learning", "deep learning", "nlp", "tensorflow", "pytorch"]):
        features["Major"] = "Artificial Intelligence"
    elif any(k in interests or k in skill_names for k in ["cybersecurity", "ethical hacking", "network security"]):
        features["Major"] = "Cybersecurity"
    elif any(k in interests or k in skill_names for k in ["cloud", "cloud computing", "aws", "azure", "gcp", "devops", "kubernetes", "docker"]):
        features["Major"] = "Information Technology"
    elif any(k in interests or k in skill_names for k in ["business analytics", "business analysis", "product management"]):
        features["Major"] = "Business Analytics"
    elif any(k in interests or k in skill_names for k in ["web development", "react", "node.js", "frontend", "javascript", "html/css"]):
        features["Major"] = "Software Engineering"
    else:
        features["Major"] = student.branch or "Computer Science"

    # Assessment scores
    latest = (
        Assessment.query.filter_by(student_id=student.id, status="completed")
        .order_by(Assessment.completed_at.desc())
        .first()
    )
    if latest:
        report = latest.get_score_report()
        features["Programming_Skill"] = report.get("Python", report.get("REST API", report.get("SQL", 80)))
        features["Problem_Solving"] = report.get("Problem Solving", report.get("logical", 85))
        features["Communication_Skills"] = report.get("Communication", report.get("verbal", 75))
        features["Employability_Score"] = latest.total_score or 80.0
    else:
        features["Programming_Skill"] = 80
        features["Problem_Solving"] = 80
        features["Communication_Skills"] = 75
        features["Employability_Score"] = 80.0

    features["Projects_Completed"] = max(len(skill_names) // 2, 2)
    features["Certifications"] = 2
    features["Hackathons"] = 1
    features["Internships"] = 1
    features["Resume_Score"] = 85 if student.resume_parsed else 70

    return features


@career_bp.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    try:
        from ml.predict import predict_career

        feature_dict = _build_student_feature_dict(student)
        predictions = predict_career(feature_dict, top_k=3)

        return jsonify({
            "predictions": predictions,
            "top_career": predictions[0]["career"] if predictions else None,
        }), 200

    except Exception as e:
        logger.error("Career prediction failed: %s", e, exc_info=True)
        return jsonify({"error": "Prediction failed", "detail": str(e)}), 500


@career_bp.route("/gap", methods=["GET"])
@jwt_required()
def gap_analysis():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    career_title = request.args.get("career")
    if not career_title:
        # Auto-predict to get top career
        try:
            from ml.predict import predict_career
            feature_dict = _build_student_feature_dict(student)
            predictions = predict_career(feature_dict, top_k=1)
            career_title = predictions[0]["career"] if predictions else None
        except Exception as e:
            logger.error("Auto-predict for gap failed: %s", e)
            career_title = None

    if not career_title:
        return jsonify({"error": "career parameter is required"}), 400

    gap = analyze_gap(student_id, career_title)
    return jsonify({"gap_analysis": gap}), 200


@career_bp.route("/recommend", methods=["GET"])
@jwt_required()
def recommend():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    career_title = request.args.get("career")
    if not career_title:
        return jsonify({"error": "career parameter is required"}), 400

    gap = analyze_gap(student_id, career_title)
    recommendations = get_full_recommendation(career_title, gap)

    return jsonify({"recommendations": recommendations}), 200


@career_bp.route("/list", methods=["GET"])
@jwt_required()
def list_careers():
    careers = Career.query.order_by(Career.title).all()
    return jsonify({"careers": [c.to_dict() for c in careers]}), 200
