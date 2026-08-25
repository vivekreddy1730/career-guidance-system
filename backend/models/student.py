from extensions import db
from datetime import datetime


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    phone = db.Column(db.String(20), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    name = db.Column(db.String(100), nullable=True)
    college = db.Column(db.String(200), nullable=True)
    branch = db.Column(db.String(100), nullable=True)
    year = db.Column(db.Integer, nullable=True)
    cgpa = db.Column(db.Float, nullable=True)
    interests = db.Column(db.Text, nullable=True)          # JSON array string
    resume_url = db.Column(db.String(500), nullable=True)
    resume_parsed = db.Column(db.Boolean, default=False)
    firebase_uid = db.Column(db.String(128), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    skills = db.relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    assessments = db.relationship("Assessment", back_populates="student", cascade="all, delete-orphan")
    roadmaps = db.relationship("Roadmap", back_populates="student", cascade="all, delete-orphan")

    def get_interests(self):
        import json
        if not self.interests:
            return []
        if isinstance(self.interests, list):
            return self.interests
        try:
            return json.loads(self.interests)
        except Exception:
            return [str(self.interests)]

    def to_dict(self):
        return {
            "id": self.id,
            "phone": self.phone,
            "email": self.email,
            "name": self.name,
            "college": self.college,
            "branch": self.branch,
            "year": self.year,
            "cgpa": self.cgpa,
            "interests": self.get_interests(),
            "resume_url": self.resume_url,
            "resume_parsed": self.resume_parsed,
            "firebase_uid": self.firebase_uid,
            "skills": [ss.to_dict() for ss in self.skills] if self.skills else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
