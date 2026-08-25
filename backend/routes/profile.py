"""
routes/profile.py — Student profile CRUD + resume upload.
GET  /api/profile          → get profile
PUT  /api/profile          → update profile
POST /api/profile/resume   → upload + parse resume
GET  /api/profile/resume   → get parsed resume data
"""
import json
import logging
import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from extensions import db
from models.student import Student
from models.skill import Skill, StudentSkill

profile_bp = Blueprint("profile", __name__)
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {"pdf", "doc", "docx"}


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _upload_to_firebase(file_bytes: bytes, filename: str, bucket_name: str) -> str:
    """Upload file to Firebase Storage, return public URL."""
    try:
        from firebase_admin import storage
        bucket = storage.bucket(bucket_name)
        blob = bucket.blob(f"resumes/{filename}")
        blob.upload_from_string(file_bytes, content_type="application/octet-stream")
        blob.make_public()
        return blob.public_url
    except Exception as e:
        logger.warning("Firebase Storage upload failed: %s. Using local storage.", e)
        return None


def _save_local(file_bytes: bytes, filename: str, upload_folder: str) -> str:
    os.makedirs(upload_folder, exist_ok=True)
    path = os.path.join(upload_folder, filename)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return f"/uploads/{filename}"


@profile_bp.route("", methods=["GET"])
@jwt_required()
def get_profile():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    profile = student.to_dict()
    profile["skills"] = [s.to_dict() for s in student.skills]
    return jsonify({"profile": profile}), 200


@profile_bp.route("", methods=["PUT"])
@jwt_required()
def update_profile():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    data = request.get_json(silent=True) or {}

    # Update scalar fields
    for field in ["name", "email", "college", "branch", "year", "cgpa"]:
        if field in data:
            setattr(student, field, data[field])

    if "interests" in data:
        student.interests = json.dumps(data["interests"])

    # Update skills
    if "skills" in data:
        # Remove old declared skills
        StudentSkill.query.filter_by(
            student_id=student_id, source="declared"
        ).delete()

        for skill_entry in data["skills"]:
            if isinstance(skill_entry, str):
                skill_name = skill_entry.strip()
                proficiency = 50
            else:
                skill_name = skill_entry.get("name", "").strip()
                proficiency = skill_entry.get("proficiency", 50)

            if not skill_name:
                continue

            skill = Skill.query.filter(
                Skill.name.ilike(skill_name)
            ).first()
            if not skill:
                skill = Skill(name=skill_name, category="other")
                db.session.add(skill)
                db.session.flush()

            ss = StudentSkill(
                student_id=student_id,
                skill_id=skill.id,
                proficiency=proficiency,
                source="declared",
            )
            db.session.add(ss)

    db.session.commit()
    return jsonify({"message": "Profile updated", "profile": student.to_dict()}), 200


@profile_bp.route("/resume", methods=["POST"])
@jwt_required()
def upload_resume():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    if "resume" not in request.files:
        return jsonify({"error": "No resume file provided"}), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not _allowed_file(file.filename):
        return jsonify({"error": "Only PDF, DOC, DOCX files are allowed"}), 400

    filename = secure_filename(f"student_{student_id}_{file.filename}")
    file_bytes = file.read()

    # Try Firebase Storage first
    bucket = current_app.config.get("FIREBASE_STORAGE_BUCKET", "")
    url = None
    if bucket:
        url = _upload_to_firebase(file_bytes, filename, bucket)

    if not url:
        url = _save_local(file_bytes, filename, current_app.config["UPLOAD_FOLDER"])

    student.resume_url = url

    # Parse resume
    from nlp.resume_parser import parse_resume, flag_inconsistencies

    parsed = parse_resume(file_bytes, file.filename)

    # Add parsed skills to DB
    if "skills" in parsed and not parsed.get("error"):
        declared = [ss.skill.name for ss in student.skills if ss.source == "declared"]
        inconsistencies = flag_inconsistencies(parsed, declared)

        for skill_name in parsed["skills"]:
            skill = Skill.query.filter(Skill.name.ilike(skill_name)).first()
            if not skill:
                skill = Skill(name=skill_name, category="other")
                db.session.add(skill)
                db.session.flush()

            # Avoid duplicate
            existing = StudentSkill.query.filter_by(
                student_id=student_id, skill_id=skill.id, source="parsed"
            ).first()
            if not existing:
                ss = StudentSkill(
                    student_id=student_id,
                    skill_id=skill.id,
                    proficiency=60,
                    source="parsed",
                )
                db.session.add(ss)

        student.resume_parsed = True
        db.session.commit()

        return jsonify({
            "message": "Resume uploaded and parsed successfully",
            "resume_url": url,
            "parsed_data": parsed,
            "inconsistencies": inconsistencies,
        }), 200

    db.session.commit()
    return jsonify({
        "message": "Resume uploaded (parsing issue — please check format)",
        "resume_url": url,
        "parsed_data": parsed,
    }), 200


@profile_bp.route("/resume", methods=["GET"])
@jwt_required()
def get_resume_data():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    parsed_skills = [
        ss.to_dict() for ss in student.skills if ss.source == "parsed"
    ]
    return jsonify({
        "resume_url": student.resume_url,
        "resume_parsed": student.resume_parsed,
        "parsed_skills": parsed_skills,
    }), 200
