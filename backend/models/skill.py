from extensions import db
from datetime import datetime


class Skill(db.Model):
    __tablename__ = "skills"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(50), nullable=True)   # e.g. "programming", "cloud", "soft"
    description = db.Column(db.Text, nullable=True)

    student_skills = db.relationship("StudentSkill", back_populates="skill")
    career_skills = db.relationship("CareerRequiredSkill", back_populates="skill")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
        }


class StudentSkill(db.Model):
    __tablename__ = "student_skills"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    proficiency = db.Column(db.Integer, default=50)   # 0–100 self-reported
    source = db.Column(db.String(20), default="declared")  # declared | assessed | parsed

    student = db.relationship("Student", back_populates="skills")
    skill = db.relationship("Skill", back_populates="student_skills")

    __table_args__ = (
        db.UniqueConstraint("student_id", "skill_id", "source", name="uq_student_skill_source"),
    )

    def to_dict(self):
        return {
            "skill_id": self.skill_id,
            "skill_name": self.skill.name if self.skill else None,
            "category": self.skill.category if self.skill else None,
            "proficiency": self.proficiency,
            "source": self.source,
        }
