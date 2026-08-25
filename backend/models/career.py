from extensions import db
import json


class Career(db.Model):
    __tablename__ = "careers"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    avg_salary_inr = db.Column(db.Integer, nullable=True)
    demand_level = db.Column(db.String(20), default="high")   # low | medium | high
    industry = db.Column(db.String(100), nullable=True)
    search_keywords = db.Column(db.Text, nullable=True)   # JSON list for Adzuna queries

    required_skills = db.relationship("CareerRequiredSkill", back_populates="career", cascade="all, delete-orphan")
    courses = db.relationship("Course", back_populates="career")
    certifications = db.relationship("Certification", back_populates="career")

    def get_search_keywords(self):
        return json.loads(self.search_keywords) if self.search_keywords else [self.title]

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "avg_salary_inr": self.avg_salary_inr,
            "demand_level": self.demand_level,
            "industry": self.industry,
        }


class CareerRequiredSkill(db.Model):
    __tablename__ = "career_required_skills"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    career_id = db.Column(db.Integer, db.ForeignKey("careers.id", ondelete="CASCADE"), nullable=False)
    skill_id = db.Column(db.Integer, db.ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    importance = db.Column(db.Integer, default=75)   # 0–100 how critical

    career = db.relationship("Career", back_populates="required_skills")
    skill = db.relationship("Skill", back_populates="career_skills")

    def to_dict(self):
        return {
            "skill_id": self.skill_id,
            "skill_name": self.skill.name if self.skill else None,
            "importance": self.importance,
        }
