"""
recommendation.py — Rule-based course and certification recommender.
Maps career + skill gaps to curated course/cert lists from the DB.
"""
import logging
from typing import Dict, List, Any

from extensions import db
from models.career import Career
from models.course import Course, Certification

logger = logging.getLogger(__name__)


def recommend_courses(career_title: str, gap_skills: List[str], limit: int = 8) -> List[Dict]:
    """Return courses relevant to a career and its skill gaps."""
    career = Career.query.filter_by(title=career_title).first()
    results = []

    if career:
        # Courses matching career
        career_courses = (
            Course.query.filter_by(career_id=career.id)
            .order_by(Course.level)
            .limit(limit)
            .all()
        )
        results.extend([c.to_dict() for c in career_courses])

    # If gaps, also pull courses matching skill tags
    if gap_skills and len(results) < limit:
        for skill in gap_skills[:3]:
            skill_courses = (
                Course.query.filter(
                    Course.skill_tag.ilike(f"%{skill}%")
                )
                .limit(3)
                .all()
            )
            for c in skill_courses:
                d = c.to_dict()
                if d not in results:
                    results.append(d)

    # Deduplicate by id
    seen = set()
    deduped = []
    for c in results:
        if c["id"] not in seen:
            seen.add(c["id"])
            deduped.append(c)

    return deduped[:limit]


def recommend_certifications(career_title: str, limit: int = 5) -> List[Dict]:
    """Return certifications relevant to a career."""
    career = Career.query.filter_by(title=career_title).first()
    if not career:
        return []

    certs = (
        Certification.query.filter_by(career_id=career.id)
        .order_by(Certification.level)
        .limit(limit)
        .all()
    )
    return [c.to_dict() for c in certs]


def get_full_recommendation(
    career_title: str,
    gap_analysis: Dict[str, Any],
) -> Dict[str, Any]:
    gap_skills = [g["skill"] for g in gap_analysis.get("gaps", [])]
    courses = recommend_courses(career_title, gap_skills)
    certifications = recommend_certifications(career_title)

    return {
        "career": career_title,
        "courses": courses,
        "certifications": certifications,
        "total_courses": len(courses),
        "total_certifications": len(certifications),
    }
