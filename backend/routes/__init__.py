from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.assessment import assessment_bp
from routes.career import career_bp
from routes.roadmap import roadmap_bp
from routes.jobs import jobs_bp
from routes.chat import chat_bp
from routes.interview import interview_bp
from routes.ats import ats_bp

__all__ = [
    "auth_bp",
    "profile_bp",
    "assessment_bp",
    "career_bp",
    "roadmap_bp",
    "jobs_bp",
    "chat_bp",
    "interview_bp",
    "ats_bp",
]
