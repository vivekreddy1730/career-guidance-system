"""
app.py — Flask application factory.
Creates and configures the Flask app, registers all blueprints.
"""
import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS

from config import get_config
from extensions import db, jwt, limiter, init_firebase

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


def create_app(config_override=None):
    app = Flask(__name__)

    # ── Configuration ────────────────────────────────────────────────────────
    cfg = config_override or get_config()
    app.config.from_object(cfg)

    # Allow SQLALCHEMY_DATABASE_URI from property if it's a Config instance
    if hasattr(cfg, "SQLALCHEMY_DATABASE_URI"):
        app.config["SQLALCHEMY_DATABASE_URI"] = cfg.SQLALCHEMY_DATABASE_URI

    # ── Ensure upload directory exists ───────────────────────────────────────
    os.makedirs(app.config.get("UPLOAD_FOLDER", "uploads"), exist_ok=True)
    os.makedirs(
        app.config.get("ML_MODELS_DIR", "ml/models"), exist_ok=True
    )

    # ── Extensions ───────────────────────────────────────────────────────────
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": "*",
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
            }
        },
    )
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    init_firebase(app)

    # ── Register Blueprints ──────────────────────────────────────────────────
    from routes.auth import auth_bp
    from routes.profile import profile_bp
    from routes.assessment import assessment_bp
    from routes.career import career_bp
    from routes.roadmap import roadmap_bp
    from routes.jobs import jobs_bp
    from routes.chat import chat_bp
    from routes.interview import interview_bp
    from routes.ats import ats_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(assessment_bp, url_prefix="/api/assessment")
    app.register_blueprint(career_bp, url_prefix="/api/career")
    app.register_blueprint(roadmap_bp, url_prefix="/api/roadmap")
    app.register_blueprint(jobs_bp, url_prefix="/api/jobs")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(interview_bp, url_prefix="/api/interview")
    app.register_blueprint(ats_bp, url_prefix="/api/ats")

    # ── Health check ─────────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "version": "1.0.0"})

    # ── Global error handlers ─────────────────────────────────────────────────
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request", "detail": str(e)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorized"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden"}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    # ── Create tables & seed on first run (dev convenience) ───────────────────
    with app.app_context():
        try:
            db.create_all()
            from migrations.seed_helper import auto_seed
            auto_seed()
        except Exception as exc:
            app.logger.warning("DB create_all/seed failed: %s", exc)

    return app


# Module-level app instance for gunicorn / direct run
# Tests create their own app via create_app(TestingConfig())
import os as _os
if _os.environ.get("FLASK_TESTING") != "1":
    app = create_app()

if __name__ == "__main__":
    _app = create_app()
    _app.run(host="0.0.0.0", port=int(_os.environ.get("PORT", 5000)))
