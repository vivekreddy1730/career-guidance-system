from extensions import db
from datetime import datetime
import json


class AssessmentQuestion(db.Model):
    __tablename__ = "assessment_questions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    section = db.Column(db.String(50), nullable=False)   # aptitude | technical
    sub_section = db.Column(db.String(50), nullable=True)  # logical | quant | verbal | python | sql ...
    question_text = db.Column(db.Text, nullable=False)
    options = db.Column(db.Text, nullable=False)           # JSON array of 4 options
    correct_index = db.Column(db.Integer, nullable=False)  # 0-3
    difficulty = db.Column(db.String(10), default="medium")
    skill_tag = db.Column(db.String(50), nullable=True)    # maps to a skill name


class Assessment(db.Model):
    __tablename__ = "assessments"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    score_report = db.Column(db.Text, nullable=True)       # JSON: {skill: score, ...}
    total_score = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(20), default="in_progress")  # in_progress | completed

    student = db.relationship("Student", back_populates="assessments")
    responses = db.relationship("AssessmentResponse", back_populates="assessment", cascade="all, delete-orphan")

    def get_score_report(self):
        return json.loads(self.score_report) if self.score_report else {}

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "score_report": self.get_score_report(),
            "total_score": self.total_score,
            "status": self.status,
        }


class AssessmentResponse(db.Model):
    __tablename__ = "assessment_responses"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("assessment_questions.id"), nullable=False)
    selected_index = db.Column(db.Integer, nullable=True)  # None = skipped
    is_correct = db.Column(db.Boolean, nullable=True)

    assessment = db.relationship("Assessment", back_populates="responses")
    question = db.relationship("AssessmentQuestion")
