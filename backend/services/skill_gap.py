"""
skill_gap.py — Compare student skill vector to career requirements.
Returns structured gap analysis + human-readable statement.
"""
import logging
from typing import Dict, List, Any

from extensions import db
from models.career import Career, CareerRequiredSkill
from models.skill import Skill, StudentSkill

logger = logging.getLogger(__name__)


def get_student_skill_map(student_id: int) -> Dict[str, int]:
    """Returns {skill_name_lower: max_proficiency}."""
    rows = (
        db.session.query(StudentSkill, Skill)
        .join(Skill, StudentSkill.skill_id == Skill.id)
        .filter(StudentSkill.student_id == student_id)
        .all()
    )
    result: Dict[str, int] = {}
    for ss, skill in rows:
        key = skill.name.lower()
        result[key] = max(result.get(key, 0), ss.proficiency)
    return result


def analyze_gap(student_id: int, career_title: str) -> Dict[str, Any]:
    """
    Compare student skills to career requirements.

    Returns:
        {
          "career": str,
          "total_required": int,
          "gaps": [{"skill": str, "required_importance": int, "student_level": int, "gap": int}],
          "strengths": [str],
          "gap_statement": str,
          "gap_score": float,   # 0 = no gap, 100 = all missing
        }
    """
    career = Career.query.filter_by(title=career_title).first()
    if not career:
        return {"error": f"Career '{career_title}' not found in database."}

    required = (
        db.session.query(CareerRequiredSkill, Skill)
        .join(Skill, CareerRequiredSkill.skill_id == Skill.id)
        .filter(CareerRequiredSkill.career_id == career.id)
        .all()
    )

    student_skills = get_student_skill_map(student_id)
    gaps = []
    strengths = []

    for req, skill in required:
        student_level = student_skills.get(skill.name.lower(), 0)
        threshold = max(req.importance * 0.6, 30)  # 60% of importance = pass

        if student_level < threshold:
            gaps.append({
                "skill": skill.name,
                "required_importance": req.importance,
                "student_level": student_level,
                "gap": round(threshold - student_level),
            })
        else:
            strengths.append(skill.name)

    # Sort gaps by severity
    gaps.sort(key=lambda x: x["gap"], reverse=True)

    gap_score = round(len(gaps) / max(len(required), 1) * 100, 1)

    # Human-readable statement
    if not gaps:
        gap_statement = (
            f"Excellent! Your profile is well-aligned for a career as {career_title}. "
            f"Keep building on your strengths in {', '.join(strengths[:3])}."
        )
    else:
        top_gaps = [g["skill"] for g in gaps[:3]]
        gap_statement = (
            f"To become a {career_title}, focus on improving: "
            f"{', '.join(top_gaps)}. "
            f"You are already strong in: {', '.join(strengths[:3]) if strengths else 'building your foundation'}."
        )

    return {
        "career": career_title,
        "total_required": len(required),
        "gaps": gaps,
        "strengths": strengths,
        "gap_statement": gap_statement,
        "gap_score": gap_score,
    }
