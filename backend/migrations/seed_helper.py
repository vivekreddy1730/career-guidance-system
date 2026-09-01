"""
seed_helper.py — Auto-seeds and updates SQLite / MySQL databases with questions and skills.
"""
import os
import json
import logging
from sqlalchemy import text
from extensions import db
from models.skill import Skill
from models.career import Career
from models.assessment import AssessmentQuestion

logger = logging.getLogger(__name__)


def seed_demo_user():
    """Ensure the demo/admin user account always exists with known credentials.

    Render free tier uses ephemeral storage, so the SQLite database is wiped
    on every deploy. This function re-creates the primary user account on
    each startup so that login always works.
    """
    from models.student import Student

    demo_email = os.environ.get("DEMO_USER_EMAIL", "pallakananireddy@gmail.com")
    demo_password = os.environ.get("DEMO_USER_PASSWORD", "password123")
    demo_name = os.environ.get("DEMO_USER_NAME", "Tejaswini Reddy")

    try:
        student = Student.query.filter_by(email=demo_email).first()
        if student:
            # Always reset the password so it stays in sync
            student.set_password(demo_password)
            if not student.name:
                student.name = demo_name
            db.session.commit()
            logger.info("✅ Demo user '%s' password reset on startup.", demo_email)
        else:
            student = Student(
                email=demo_email,
                name=demo_name,
                auth_provider="email",
            )
            student.set_password(demo_password)
            db.session.add(student)
            db.session.commit()
            logger.info("✅ Demo user '%s' created on startup.", demo_email)
    except Exception as exc:
        db.session.rollback()
        logger.warning("Demo user seed failed: %s", exc)


def auto_seed(force_questions: bool = False):
    """Seed base data and ensure comprehensive question bank is loaded."""
    try:
        # Always ensure the demo user exists first
        seed_demo_user()

        total_questions = AssessmentQuestion.query.count()
        if total_questions >= 45 and not force_questions:
            return  # Already has sufficient question bank

        logger.info("Updating database reference data and questions...")
        seed_path = os.path.join(os.path.dirname(__file__), "seed_data.sql")
        if not os.path.exists(seed_path):
            return

        with open(seed_path, "r", encoding="utf-8") as f:
            raw_sql = f.read()

        # Split and execute individual insert statements
        statements = [s.strip() for s in raw_sql.split(";") if s.strip()]
        for stmt in statements:
            # SQLite does not support 'INSERT IGNORE INTO', change to 'INSERT OR IGNORE INTO'
            sqlite_stmt = stmt.replace("INSERT IGNORE INTO", "INSERT OR IGNORE INTO")
            try:
                db.session.execute(text(sqlite_stmt))
            except Exception as e:
                logger.debug("Statement skipped: %s", e)

        db.session.commit()
        logger.info("✅ Database seeded with %d questions.", AssessmentQuestion.query.count())
    except Exception as exc:
        db.session.rollback()
        logger.warning("Auto-seed encountered an issue: %s", exc)

