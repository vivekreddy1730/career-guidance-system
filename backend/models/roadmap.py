from extensions import db
from datetime import datetime
import json


class Roadmap(db.Model):
    __tablename__ = "roadmaps"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    career_title = db.Column(db.String(100), nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    total_months = db.Column(db.Integer, default=6)
    summary = db.Column(db.Text, nullable=True)

    student = db.relationship("Student", back_populates="roadmaps")
    milestones = db.relationship("RoadmapMilestone", back_populates="roadmap", cascade="all, delete-orphan", order_by="RoadmapMilestone.month")

    def to_dict(self):
        return {
            "id": self.id,
            "career_title": self.career_title,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "total_months": self.total_months,
            "summary": self.summary,
            "milestones": [m.to_dict() for m in self.milestones],
        }


class RoadmapMilestone(db.Model):
    __tablename__ = "roadmap_milestones"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    roadmap_id = db.Column(db.Integer, db.ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    tasks = db.Column(db.Text, nullable=True)        # JSON list of task strings
    courses = db.Column(db.Text, nullable=True)      # JSON list of course dicts
    certifications = db.Column(db.Text, nullable=True)  # JSON list of cert dicts
    is_completed = db.Column(db.Boolean, default=False)

    roadmap = db.relationship("Roadmap", back_populates="milestones")

    def to_dict(self):
        return {
            "id": self.id,
            "month": self.month,
            "title": self.title,
            "description": self.description,
            "tasks": json.loads(self.tasks) if self.tasks else [],
            "courses": json.loads(self.courses) if self.courses else [],
            "certifications": json.loads(self.certifications) if self.certifications else [],
            "is_completed": self.is_completed,
        }
