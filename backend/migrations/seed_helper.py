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


def auto_seed(force_questions: bool = False):
    """Seed base data and ensure comprehensive question bank is loaded."""
    try:
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
