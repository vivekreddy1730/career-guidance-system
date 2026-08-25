from extensions import db


class Course(db.Model):
    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    provider = db.Column(db.String(50), nullable=False)   # Coursera | Udemy | edX | NPTEL
    url = db.Column(db.String(500), nullable=True)
    skill_tag = db.Column(db.String(100), nullable=True)
    career_id = db.Column(db.Integer, db.ForeignKey("careers.id", ondelete="SET NULL"), nullable=True)
    level = db.Column(db.String(20), default="beginner")  # beginner | intermediate | advanced
    duration_weeks = db.Column(db.Integer, nullable=True)
    is_free = db.Column(db.Boolean, default=False)

    career = db.relationship("Career", back_populates="courses")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "provider": self.provider,
            "url": self.url,
            "skill_tag": self.skill_tag,
            "level": self.level,
            "duration_weeks": self.duration_weeks,
            "is_free": self.is_free,
        }


class Certification(db.Model):
    __tablename__ = "certifications"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(200), nullable=False)
    provider = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(500), nullable=True)
    career_id = db.Column(db.Integer, db.ForeignKey("careers.id", ondelete="SET NULL"), nullable=True)
    skill_tag = db.Column(db.String(100), nullable=True)
    level = db.Column(db.String(20), default="associate")  # foundational | associate | professional | expert
    cost_usd = db.Column(db.Integer, nullable=True)

    career = db.relationship("Career", back_populates="certifications")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "provider": self.provider,
            "url": self.url,
            "skill_tag": self.skill_tag,
            "level": self.level,
            "cost_usd": self.cost_usd,
        }
