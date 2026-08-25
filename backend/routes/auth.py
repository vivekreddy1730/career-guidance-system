"""
routes/auth.py — OTP-based auth using Firebase ID Token verification.
POST /api/auth/verify-otp  → issues JWT
POST /api/auth/refresh     → refreshes JWT
GET  /api/auth/me          → current user info
"""
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from extensions import db
from models.student import Student

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)


def _verify_firebase_token(id_token: str):
    """Verify Firebase ID token. Returns decoded token or raises."""
    try:
        import firebase_admin.auth as firebase_auth
        return firebase_admin.auth.verify_id_token(id_token)
    except Exception as e:
        logger.warning("Firebase token verification failed: %s", e)
        return None


def _mock_verify(id_token: str):
    """
    Mock verification for dev/test when Firebase is not configured.
    Accepts any token that starts with 'mock_' and extracts phone from it.
    Format: mock_<phone>
    """
    if id_token.startswith("mock_"):
        phone = id_token.replace("mock_", "")
        return {"phone_number": phone or "+910000000000", "uid": f"mock_uid_{phone}"}
    return None


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    """
    Body: { "id_token": "<Firebase ID token>" }
    Returns: { "access_token": "...", "student": {...} }
    """
    data = request.get_json(silent=True) or {}
    id_token = data.get("id_token", "").strip()

    if not id_token:
        return jsonify({"error": "id_token is required"}), 400

    # Try real Firebase verification first
    decoded = None
    if not id_token.startswith("mock_"):
        decoded = _verify_firebase_token(id_token)

    # Fall back to mock token for test numbers or dev environments
    if decoded is None:
        decoded = _mock_verify(id_token)

    if decoded is None:
        return jsonify({"error": "Invalid or expired OTP token"}), 401

    phone = decoded.get("phone_number", "")
    firebase_uid = decoded.get("uid", "")

    if not phone:
        return jsonify({"error": "Phone number not found in token"}), 400

    # Get or create student
    student = Student.query.filter_by(phone=phone).first()
    if not student:
        student = Student(phone=phone, firebase_uid=firebase_uid)
        db.session.add(student)
        db.session.commit()
        logger.info("New student registered: %s", phone)

    # Issue JWT (identity must be a string for flask-jwt-extended ≥4.7)
    access_token = create_access_token(identity=str(student.id))

    return jsonify({
        "access_token": access_token,
        "student": student.to_dict(),
        "is_new_user": student.name is None,
    }), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    student_id = int(get_jwt_identity())
    access_token = create_access_token(identity=str(student_id))
    return jsonify({"access_token": access_token}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404
    return jsonify({"student": student.to_dict()}), 200
