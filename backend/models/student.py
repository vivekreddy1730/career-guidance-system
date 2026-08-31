from extensions import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    phone = db.Column(db.String(50), unique=True, nullable=True, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(255), nullable=True)
    auth_provider = db.Column(db.String(50), default="phone")  # phone | email | google
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

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

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
            "auth_provider": self.auth_provider,
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
