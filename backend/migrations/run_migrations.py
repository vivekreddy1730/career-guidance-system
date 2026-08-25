"""
run_migrations.py — Apply DDL + seed data to configured MySQL database.
Usage: python migrations/run_migrations.py
"""
import os
import sys
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import PyMySQL
from config import get_config

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def run_sql_file(cursor, filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        sql = f.read()

    statements = [s.strip() for s in sql.split(";") if s.strip()]
    for stmt in statements:
        try:
            cursor.execute(stmt)
        except Exception as e:
            logger.warning("Skipped: %s... — %s", stmt[:60], e)


def main():
    cfg = get_config()
    ssl = {"ssl": {"verify_cert": False}} if cfg.DB_SSL else {}

    logger.info("Connecting to %s@%s/%s", cfg.DB_USER, cfg.DB_HOST, cfg.DB_NAME)
    conn = PyMySQL.connect(
        host=cfg.DB_HOST,
        port=cfg.DB_PORT,
        user=cfg.DB_USER,
        password=cfg.DB_PASSWORD,
        database=cfg.DB_NAME,
        autocommit=True,
        **ssl,
    )

    migrations_dir = os.path.dirname(__file__)

    with conn.cursor() as cursor:
        logger.info("Running DDL: 001_create_tables.sql")
        run_sql_file(cursor, os.path.join(migrations_dir, "001_create_tables.sql"))

        logger.info("Running seed: seed_data.sql")
        run_sql_file(cursor, os.path.join(migrations_dir, "seed_data.sql"))

    conn.close()
    logger.info("✅ Migrations complete.")


if __name__ == "__main__":
    main()
