"""
routes/chat.py — AI chatbot grounded in the student's own data.
POST /api/chat  → send message, receive context-aware response
GET  /api/chat/history → get chat history (session-based, in-memory for now)
"""
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.student import Student
from models.assessment import Assessment
from models.roadmap import Roadmap
from services.skill_gap import analyze_gap

chat_bp = Blueprint("chat", __name__)
logger = logging.getLogger(__name__)

# In-memory chat history per student (resets on server restart)
# For production, persist to DB or Redis
_chat_history: dict = {}


def _build_system_prompt(student: Student) -> str:
    """Build a grounded system prompt from student's actual data."""

    # Latest assessment
    latest_assessment = (
        Assessment.query.filter_by(student_id=student.id, status="completed")
        .order_by(Assessment.completed_at.desc())
        .first()
    )

    # Latest roadmap
    latest_roadmap = (
        Roadmap.query.filter_by(student_id=student.id)
        .order_by(Roadmap.generated_at.desc())
        .first()
    )

    skills = [ss.skill.name for ss in student.skills[:15]] if student.skills else []
    import json
    interests = json.loads(student.interests) if student.interests else []

    score_report = latest_assessment.get_score_report() if latest_assessment else {}
    career = latest_roadmap.career_title if latest_roadmap else "Not predicted yet"

    system = f"""You are CareerBot, an AI career advisor for students. You have access to this specific student's data — use it to give personalized, concrete answers. Never give generic advice when the student's data is available.

## Student Profile
- Name: {student.name or 'Student'}
- College: {student.college or 'Not specified'}
- Branch: {student.branch or 'Not specified'}, Year: {student.year or 'N/A'}
- CGPA: {student.cgpa or 'Not specified'}
- Declared Skills: {', '.join(skills) if skills else 'Not yet added'}
- Interests: {', '.join(interests) if interests else 'Not specified'}

## Assessment Results
{f'Score Report: {score_report}' if score_report else 'No assessment completed yet.'}
{f'Overall Score: {latest_assessment.total_score}%' if latest_assessment else ''}

## Predicted Career
{career}

## Instructions
- Answer questions about suitable careers, what to learn next, best certifications, and job market using the student's actual data above.
- Be encouraging, specific, and actionable.
- Keep answers concise (2-4 sentences) unless a detailed plan is requested.
- If the student hasn't completed assessment yet, encourage them to do so for better predictions.
- When asked about certifications, refer to their predicted career ({career}).
"""
    return system


def _call_openai(api_key: str, messages: list) -> str:
    """Call OpenAI chat completion API."""
    try:
        import os
        os.environ.pop("HTTP_PROXY", None)
        os.environ.pop("HTTPS_PROXY", None)
        os.environ.pop("http_proxy", None)
        os.environ.pop("https_proxy", None)
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.warning("OpenAI chat error: %s", e)
        return None


def _fallback_response(message: str, student: Student) -> str:
    """Rule-based fallback when OpenAI is unavailable."""
    msg_lower = message.lower()

    latest_roadmap = (
        Roadmap.query.filter_by(student_id=student.id)
        .order_by(Roadmap.generated_at.desc())
        .first()
    )
    career = latest_roadmap.career_title if latest_roadmap else "a tech career"

    if any(kw in msg_lower for kw in ["career", "suit", "predict", "recommend"]):
        return (
            f"Based on your profile and assessment scores, {career} appears to be a strong match for you! "
            f"Complete your skill assessment and profile for a more refined prediction."
        )
    elif any(kw in msg_lower for kw in ["learn", "study", "next", "skill"]):
        skills = [ss.skill.name for ss in student.skills[:3]] if student.skills else []
        return (
            f"For your {career} path, focus on: Python, SQL, and domain-specific tools. "
            f"You already have strengths in {', '.join(skills) if skills else 'several areas'}. "
            f"Check your personalized roadmap for a month-by-month plan!"
        )
    elif any(kw in msg_lower for kw in ["cert", "certification"]):
        certs = {
            "Data Scientist": "IBM Data Science Certificate or Google Data Analytics Certificate",
            "AI/ML Engineer": "TensorFlow Developer Certificate or IBM AI Engineering Certificate",
            "Cloud Engineer": "AWS Certified Solutions Architect Associate",
            "Cybersecurity Analyst": "CompTIA Security+ or CEH",
            "Web Developer": "Meta Front-End Developer Certificate",
        }
        cert = certs.get(career, "a relevant industry certification")
        return f"For {career}, I recommend starting with: {cert}. Check your Roadmap page for more options!"
    elif any(kw in msg_lower for kw in ["salary", "pay", "earn"]):
        return (
            f"For {career} roles in India, expect ₹6L–₹20L per annum depending on experience and company. "
            f"Top tech companies like Google, Microsoft, and Amazon offer significantly more. "
            f"Check the Job Market page for live salary data!"
        )
    else:
        return (
            f"Great question! As you work towards {career}, I recommend exploring your personalized roadmap, "
            f"completing skill assessments, and checking live job listings for market insights. "
            f"What specific aspect of your career journey can I help with?"
        )


@chat_bp.route("", methods=["POST"])
@jwt_required()
def chat():
    """
    Body: { "message": "Which career suits me?", "session_id": "optional" }
    Returns: { "response": "...", "session_id": "..." }
    """
    student_id = int(get_jwt_identity())
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()
    if not user_message:
        return jsonify({"error": "message is required"}), 400

    session_id = data.get("session_id", str(student_id))

    # Initialize history for this session
    if session_id not in _chat_history:
        system_prompt = _build_system_prompt(student)
        _chat_history[session_id] = [
            {"role": "system", "content": system_prompt}
        ]

    # Append user message
    _chat_history[session_id].append({"role": "user", "content": user_message})

    # Keep context window manageable (last 20 messages + system)
    messages = [_chat_history[session_id][0]] + _chat_history[session_id][-20:]

    api_key = current_app.config.get("OPENAI_API_KEY", "")
    bot_response = None

    if api_key:
        bot_response = _call_openai(api_key, messages)

    if not bot_response:
        bot_response = _fallback_response(user_message, student)

    # Append assistant response
    _chat_history[session_id].append({"role": "assistant", "content": bot_response})

    return jsonify({
        "response": bot_response,
        "session_id": session_id,
    }), 200


@chat_bp.route("/history", methods=["GET"])
@jwt_required()
def get_history():
    student_id = int(get_jwt_identity())
    session_id = request.args.get("session_id", str(student_id))

    history = _chat_history.get(session_id, [])
    # Exclude system prompt
    messages = [h for h in history if h["role"] != "system"]

    return jsonify({"history": messages, "session_id": session_id}), 200


@chat_bp.route("/history", methods=["DELETE"])
@jwt_required()
def clear_history():
    student_id = int(get_jwt_identity())
    session_id = request.args.get("session_id", str(student_id))
    _chat_history.pop(session_id, None)
    return jsonify({"message": "Chat history cleared"}), 200
