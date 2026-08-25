"""
extensions.py — Shared Flask extension instances.
Import these in routes/models instead of creating new instances.
"""
import os
import logging

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

logger = logging.getLogger(__name__)

db = SQLAlchemy()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

_firebase_initialized = False


def init_firebase(app):
    """Initialize Firebase Admin SDK. Safe to call multiple times."""
    global _firebase_initialized
    if _firebase_initialized:
        return

    try:
        import firebase_admin
        from firebase_admin import credentials

        sa_path = app.config.get("FIREBASE_SERVICE_ACCOUNT_PATH", "")
        bucket = app.config.get("FIREBASE_STORAGE_BUCKET", "")

        if sa_path and os.path.exists(sa_path):
            cred = credentials.Certificate(sa_path)
            firebase_admin.initialize_app(
                cred,
                {"storageBucket": bucket} if bucket else {},
            )
            _firebase_initialized = True
            logger.info("Firebase Admin SDK initialized successfully.")
        else:
            logger.warning(
                "Firebase service account file not found at '%s'. "
                "OTP verification will use mock mode.",
                sa_path,
            )
    except Exception as exc:
        logger.warning("Firebase initialization failed: %s. Mock mode active.", exc)
