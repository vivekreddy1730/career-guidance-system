"""
routes/ats.py — ATS Resume Scanner & Bullet-Point Optimizer endpoints.
POST /api/ats/scan            → Scan resume text against target career
POST /api/ats/optimize-bullet → Transform bullet point into Google X-Y-Z formula
"""
import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.ats_scanner import scan_resume, optimize_bullet_point
from models.student import Student

ats_bp = Blueprint("ats", __name__)
logger = logging.getLogger(__name__)


@ats_bp.route("/scan", methods=["POST"])
@jwt_required()
def scan():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    data = request.get_json(silent=True) or {}
    target_career = data.get("career", "Software Engineer")
    resume_text = (data.get("resume_text") or "").strip()

    if not resume_text:
        return jsonify({
            "error": "Please paste or enter your resume text before scanning."
        }), 400

    result = scan_resume(resume_text=resume_text, target_career=target_career)
    return jsonify({"ats_analysis": result}), 200


@ats_bp.route("/optimize-bullet", methods=["POST"])
@jwt_required()
def optimize_bullet():
    data = request.get_json(silent=True) or {}
    bullet_text = (data.get("bullet_text") or "").strip()
    target_role = data.get("target_role", "Software Engineer")

    if not bullet_text:
        return jsonify({"error": "Please provide a bullet point to optimize."}), 400

    result = optimize_bullet_point(bullet_text=bullet_text, target_role=target_role)
    return jsonify({"optimization": result}), 200
