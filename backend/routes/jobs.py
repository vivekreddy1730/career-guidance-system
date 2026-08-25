"""
routes/jobs.py — Live job listings, salary insights, and trending skills.
GET /api/jobs              → live job listings for a career
GET /api/jobs/trending     → trending skills data
GET /api/jobs/salary       → salary insights for a career
"""
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required

from services.job_market import fetch_jobs, get_trending_skills, get_salary_insights

jobs_bp = Blueprint("jobs", __name__)
logger = logging.getLogger(__name__)


@jobs_bp.route("", methods=["GET"])
@jwt_required()
def get_jobs():
    career = request.args.get("career", "Software Engineer")
    page = int(request.args.get("page", 1))

    result = fetch_jobs(
        career_title=career,
        adzuna_app_id=current_app.config.get("ADZUNA_APP_ID", ""),
        adzuna_api_key=current_app.config.get("ADZUNA_API_KEY", ""),
        jsearch_api_key=current_app.config.get("JSEARCH_API_KEY", ""),
        country=current_app.config.get("ADZUNA_COUNTRY", "in"),
    )

    return jsonify(result), 200


@jobs_bp.route("/trending", methods=["GET"])
@jwt_required()
def trending():
    return jsonify({"trending_skills": get_trending_skills()}), 200


@jobs_bp.route("/salary", methods=["GET"])
@jwt_required()
def salary():
    career = request.args.get("career", "Software Engineer")
    return jsonify({"salary_insights": get_salary_insights(career)}), 200
