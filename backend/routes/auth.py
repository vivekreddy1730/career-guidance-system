"""
routes/auth.py — Multi-method authentication:
1. Email & Password (Register & Login) with Email OTP verification
2. Google (Gmail) 1-Click Sign-In
3. Mobile Phone Number + Real-Time OTP (Firebase SMS + backend fallback)
4. JWT token issuance and refresh
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
    """Verify Firebase ID token. Returns decoded token or None."""
    try:
        import firebase_admin.auth as firebase_auth
        return firebase_auth.verify_id_token(id_token)
    except Exception as e:
        logger.warning("Firebase token verification failed: %s", e)
        return None


def _mock_verify(id_token: str):
    """Fallback verification for dev/test environments."""
    if id_token.startswith("mock_"):
        phone = id_token.replace("mock_", "")
        return {"phone_number": phone or "+910000000000", "uid": f"mock_uid_{phone}"}
    return None


# ── Email OTP: Send ──────────────────────────────────────────────────────────
@auth_bp.route("/send-email-otp", methods=["POST"])
def send_email_otp_route():
    """
    Send a real 6-digit OTP to the user's email address.
    Body: { "email": "...", "purpose": "register" | "login" }
    """
    from services.otp_service import create_otp, send_email_otp

    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    purpose = data.get("purpose", "login")

    if not email or "@" not in email:
        return jsonify({"error": "A valid email address is required"}), 400

    # For registration, check if email already exists
    if purpose == "register":
        existing = Student.query.filter_by(email=email).first()
        if existing:
            return jsonify({"error": "An account with this email already exists. Please sign in."}), 400

    # For login, check if email exists
    if purpose == "login":
        existing = Student.query.filter_by(email=email).first()
        if not existing:
            return jsonify({"error": "No account found with this email. Please register first."}), 404

    otp_code = create_otp(email)
    sent = send_email_otp(email, otp_code)

    if sent:
        return jsonify({
            "message": f"OTP sent to {email}. Check your inbox (and spam folder).",
            "otp_sent": True,
        }), 200
    else:
        return jsonify({
            "error": "Failed to send OTP email. Please try again.",
            "otp_sent": False,
        }), 500


# ── Email OTP: Verify ────────────────────────────────────────────────────────
@auth_bp.route("/verify-email-otp", methods=["POST"])
def verify_email_otp_route():
    """
    Verify the 6-digit OTP sent to email and authenticate.
    Body: { "email": "...", "otp": "123456", "purpose": "register" | "login", "name": "...", "password": "..." }
    """
    from services.otp_service import verify_otp as verify_otp_code

    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    otp = data.get("otp", "").strip()
    purpose = data.get("purpose", "login")
    name = data.get("name", "").strip()
    password = data.get("password", "")

    if not email or not otp:
        return jsonify({"error": "Email and OTP are required"}), 400

    if len(otp) != 6:
        return jsonify({"error": "OTP must be 6 digits"}), 400

    # Verify the OTP
    if not verify_otp_code(email, otp):
        return jsonify({"error": "Invalid or expired OTP. Please try again."}), 401

    # OTP is valid — proceed with auth
    student = Student.query.filter_by(email=email).first()
    is_new_user = False

    if purpose == "register" and not student:
        if not password or len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        student = Student(
            email=email,
            name=name or email.split("@")[0].capitalize(),
            auth_provider="email",
        )
        student.set_password(password)
        db.session.add(student)
        db.session.commit()
        is_new_user = True
        logger.info("New student registered via verified email OTP: %s", email)
    elif not student:
        return jsonify({"error": "No account found. Please register first."}), 404

    access_token = create_access_token(identity=str(student.id))
    return jsonify({
        "access_token": access_token,
        "student": student.to_dict(),
        "is_new_user": is_new_user or (student.college is None and student.branch is None),
        "message": "Email verified successfully!",
        "verified": True,
    }), 200


# ── Phone OTP: Send (Backend fallback) ───────────────────────────────────────
@auth_bp.route("/send-phone-otp", methods=["POST"])
def send_phone_otp_route():
    """
    Generate a 6-digit OTP for phone verification (backend-managed).
    Firebase handles SMS on frontend; this is a fallback for when Firebase SMS fails.
    Body: { "phone": "+91XXXXXXXXXX" }
    """
    from services.otp_service import create_otp, send_phone_otp

    data = request.get_json(silent=True) or {}
    phone = data.get("phone", "").strip()

    if not phone or len(phone.replace("+", "").replace(" ", "")) < 10:
        return jsonify({"error": "A valid phone number is required"}), 400

    otp_code = create_otp(phone)
    send_phone_otp(phone, otp_code)

    return jsonify({
        "message": f"OTP generated for {phone}.",
        "otp_sent": True,
    }), 200


# ── Phone OTP: Verify (Backend fallback) ─────────────────────────────────────
@auth_bp.route("/verify-phone-otp", methods=["POST"])
def verify_phone_otp_route():
    """
    Verify phone OTP via backend store (when Firebase SMS doesn't work).
    Body: { "phone": "+91XXXXXXXXXX", "otp": "123456" }
    """
    from services.otp_service import verify_otp as verify_otp_code

    data = request.get_json(silent=True) or {}
    phone = data.get("phone", "").strip()
    otp = data.get("otp", "").strip()

    if not phone or not otp:
        return jsonify({"error": "Phone and OTP are required"}), 400

    if not verify_otp_code(phone, otp):
        return jsonify({"error": "Invalid or expired OTP"}), 401

    # OTP verified — create or find student
    student = Student.query.filter_by(phone=phone).first()
    is_new_user = False

    if not student:
        student = Student(
            phone=phone,
            auth_provider="phone",
        )
        db.session.add(student)
        db.session.commit()
        is_new_user = True
        logger.info("New student registered via verified phone OTP: %s", phone)

    access_token = create_access_token(identity=str(student.id))
    return jsonify({
        "access_token": access_token,
        "student": student.to_dict(),
        "is_new_user": is_new_user or student.name is None,
        "verified": True,
    }), 200


# ── Forgot & Reset Password via Real Email OTP ──────────────────────────────
@auth_bp.route("/forgot-password-otp", methods=["POST"])
def forgot_password_otp():
    """
    Send a 6-digit password reset OTP to student's email address.
    Body: { "email": "..." }
    """
    from services.otp_service import create_otp, send_email_otp

    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()

    if not email or "@" not in email:
        return jsonify({"error": "Please enter a valid email address."}), 400

    student = Student.query.filter_by(email=email).first()
    if not student:
        return jsonify({"error": "No student account found with this email address."}), 404

    otp_code = create_otp(email)
    sent = send_email_otp(email, otp_code)

    return jsonify({
        "message": f"Password reset OTP sent to {email}. Check your inbox.",
        "otp_sent": True,
    }), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """
    Verify OTP and reset student's account password.
    Body: { "email": "...", "otp": "...", "new_password": "..." }
    """
    from services.otp_service import verify_otp as verify_otp_code

    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    otp = data.get("otp", "").strip()
    new_password = data.get("new_password", "")

    if not email or not otp or not new_password:
        return jsonify({"error": "Email, OTP code, and new password are required."}), 400

    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    if not verify_otp_code(email, otp):
        return jsonify({"error": "Invalid or expired OTP code. Please request a new one."}), 401

    student = Student.query.filter_by(email=email).first()
    if not student:
        return jsonify({"error": "Account not found."}), 404

    student.set_password(new_password)
    db.session.commit()
    logger.info("Password successfully reset for: %s", email)

    access_token = create_access_token(identity=str(student.id))
    return jsonify({
        "access_token": access_token,
        "student": student.to_dict(),
        "message": "Password reset successful! You are now logged in.",
    }), 200


# ── Legacy endpoints (kept for backward compatibility) ───────────────────────

@auth_bp.route("/register-email", methods=["POST"])
def register_email():
    """
    Register with Email, Password, and optional Name/Phone.
    Body: { "email": "...", "password": "...", "name": "...", "phone": "..." }
    """
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()

    if not email or "@" not in email:
        return jsonify({"error": "A valid email address is required"}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    existing_email = Student.query.filter_by(email=email).first()
    if existing_email:
        return jsonify({"error": "An account with this email already exists. Please sign in."}), 400

    if phone:
        existing_phone = Student.query.filter_by(phone=phone).first()
        if existing_phone:
            return jsonify({"error": "This phone number is already registered."}), 400

    student = Student(
        email=email,
        name=name or email.split("@")[0].capitalize(),
        phone=phone or None,
        auth_provider="email",
    )
    student.set_password(password)

    db.session.add(student)
    db.session.commit()
    logger.info("New student registered via email: %s", email)

    access_token = create_access_token(identity=str(student.id))
    return jsonify({
        "access_token": access_token,
        "student": student.to_dict(),
        "is_new_user": True,
        "message": "Registration successful",
    }), 201


@auth_bp.route("/login-email", methods=["POST"])
def login_email():
    """
    Sign in with Email and Password.
    Body: { "email": "...", "password": "..." }
    """
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    student = Student.query.filter_by(email=email).first()
    if not student or not student.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=str(student.id))
    return jsonify({
        "access_token": access_token,
        "student": student.to_dict(),
        "is_new_user": student.college is None and student.branch is None,
        "message": "Login successful",
    }), 200


@auth_bp.route("/google-login", methods=["POST"])
def google_login():
    """
    Sign in with Google (Gmail). Accepts Firebase Google ID token or user payload.
    Body: { "id_token": "...", "email": "...", "name": "...", "uid": "..." }
    """
    data = request.get_json(silent=True) or {}
    id_token = data.get("id_token", "")
    email = data.get("email", "").strip().lower()
    name = data.get("name", "").strip()
    uid = data.get("uid", "")

    decoded = None
    if id_token and not id_token.startswith("mock_"):
        decoded = _verify_firebase_token(id_token)

    if decoded:
        email = decoded.get("email", email)
        name = decoded.get("name", name)
        uid = decoded.get("uid", uid)

    if not email:
        return jsonify({"error": "Google account email is required"}), 400

    # Look up by email or firebase_uid
    student = Student.query.filter((Student.email == email) | (Student.firebase_uid == uid)).first()
    is_new_user = False

    if not student:
        student = Student(
            email=email,
            name=name or email.split("@")[0].capitalize(),
            firebase_uid=uid or f"google_{email}",
            auth_provider="google",
        )
        db.session.add(student)
        db.session.commit()
        is_new_user = True
        logger.info("New student registered via Google: %s", email)
    else:
        # Update name or uid if missing
        if name and not student.name:
            student.name = name
        if uid and not student.firebase_uid:
            student.firebase_uid = uid
        db.session.commit()

    access_token = create_access_token(identity=str(student.id))
    return jsonify({
        "access_token": access_token,
        "student": student.to_dict(),
        "is_new_user": is_new_user or (student.college is None and student.branch is None),
        "message": "Google authentication successful",
    }), 200


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    """
    Verify Mobile Phone OTP token (Firebase SMS or direct).
    Body: { "id_token": "<Firebase ID token or mock_<phone>>" }
    """
    data = request.get_json(silent=True) or {}
    id_token = data.get("id_token", "").strip()

    if not id_token:
        return jsonify({"error": "id_token is required"}), 400

    decoded = None
    if not id_token.startswith("mock_"):
        decoded = _verify_firebase_token(id_token)

    if decoded is None:
        decoded = _mock_verify(id_token)

    if decoded is None:
        return jsonify({"error": "Invalid or expired OTP token"}), 401

    phone = decoded.get("phone_number", "")
    firebase_uid = decoded.get("uid", "")

    if not phone:
        return jsonify({"error": "Phone number not found in token"}), 400

    student = Student.query.filter_by(phone=phone).first()
    is_new_user = False

    if not student:
        student = Student(phone=phone, firebase_uid=firebase_uid, auth_provider="phone")
        db.session.add(student)
        db.session.commit()
        is_new_user = True
        logger.info("New student registered via Phone OTP: %s", phone)

    access_token = create_access_token(identity=str(student.id))
    return jsonify({
        "access_token": access_token,
        "student": student.to_dict(),
        "is_new_user": is_new_user or student.name is None,
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
