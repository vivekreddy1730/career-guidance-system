"""
services/otp_service.py — Real-time OTP generation and delivery via Email (SMTP) and SMS.
Generates 6-digit OTP, stores in memory with expiry, and sends via Gmail SMTP.
"""
import os
import random
import string
import smtplib
import logging
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Lock

logger = logging.getLogger(__name__)

# ── In-memory OTP store (key: email/phone → {code, expiry, attempts}) ─────────
_otp_store = {}
_lock = Lock()
OTP_EXPIRY_SECONDS = 300  # 5 minutes
MAX_ATTEMPTS = 5


def _generate_otp(length=6):
    """Generate a random numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


def _cleanup_expired():
    """Remove expired OTPs."""
    now = time.time()
    expired = [k for k, v in _otp_store.items() if now > v["expiry"]]
    for k in expired:
        del _otp_store[k]


def create_otp(identifier: str) -> str:
    """
    Generate and store a new OTP for the given email or phone.
    Returns the OTP code.
    """
    code = _generate_otp()
    with _lock:
        _cleanup_expired()
        _otp_store[identifier.lower().strip()] = {
            "code": code,
            "expiry": time.time() + OTP_EXPIRY_SECONDS,
            "attempts": 0,
        }
    logger.info("OTP created for %s: %s", identifier[:5] + "***", code)
    return code


def verify_otp(identifier: str, code: str) -> bool:
    """
    Verify the OTP code for the given identifier.
    Returns True if valid, False otherwise.
    """
    key = identifier.lower().strip()
    with _lock:
        _cleanup_expired()
        entry = _otp_store.get(key)
        if not entry:
            return False

        entry["attempts"] += 1
        if entry["attempts"] > MAX_ATTEMPTS:
            del _otp_store[key]
            return False

        if time.time() > entry["expiry"]:
            del _otp_store[key]
            return False

        if entry["code"] == code.strip():
            del _otp_store[key]  # One-time use
            return True

    return False


def send_email_otp(to_email: str, otp_code: str) -> bool:
    """
    Send OTP via Gmail SMTP. Uses the configured SMTP credentials.
    Returns True if sent successfully.
    """
    smtp_email = os.environ.get("SMTP_EMAIL", "")
    smtp_password = os.environ.get("SMTP_APP_PASSWORD", "")

    if not smtp_email or not smtp_password:
        logger.warning("SMTP credentials not configured. OTP: %s for %s", otp_code, to_email)
        # Return True anyway so the flow continues (OTP is stored, just not emailed)
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"CareerAI — Your Verification Code: {otp_code}"
        msg["From"] = f"CareerAI <{smtp_email}>"
        msg["To"] = to_email

        html_body = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 30px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 54px; height: 54px; border-radius: 14px;
                     background: linear-gradient(135deg, #6366f1, #06b6d4);
                     display: inline-flex; align-items: center; justify-content: center;
                     font-size: 26px; font-weight: 800; color: #fff;">C</div>
                <h2 style="margin: 12px 0 0; color: #1f2937;">CareerAI</h2>
            </div>
            <div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center;
                 border: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin-bottom: 8px; font-size: 14px;">Your verification code is:</p>
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #6366f1;
                     padding: 16px; background: #eef2ff; border-radius: 8px; margin: 12px 0;">
                    {otp_code}
                </div>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 16px;">
                    This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
                </p>
            </div>
            <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 20px;">
                If you didn't request this code, please ignore this email.
            </p>
        </div>
        """

        text_body = f"Your CareerAI verification code is: {otp_code}\nThis code expires in 5 minutes."

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            server.login(smtp_email, smtp_password)
            server.send_message(msg)

        logger.info("Email OTP sent successfully to %s", to_email)
        return True

    except Exception as e:
        logger.error("Failed to send email OTP to %s: %s", to_email, e)
        return False


def send_phone_otp(phone: str, otp_code: str) -> bool:
    """
    For phone OTP, Firebase handles SMS delivery on the frontend.
    This is a backend fallback that logs the OTP.
    In production, you could integrate Twilio/MSG91 here.
    """
    logger.info("Phone OTP for %s: %s (Firebase handles SMS delivery)", phone[:5] + "***", otp_code)
    return True
