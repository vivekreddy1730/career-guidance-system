"""
config.py — Application configuration classes.
Loads environment variables via python-dotenv.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Flask
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour

    # Database
    USE_SQLITE = os.environ.get("USE_SQLITE", "true").lower() == "true"
    DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SQLALCHEMY_DATABASE_URI")
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_PORT = int(os.environ.get("DB_PORT", 3306))
    DB_USER = os.environ.get("DB_USER", "root")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
    DB_NAME = os.environ.get("DB_NAME", "career_guidance")
    DB_SSL = os.environ.get("DB_SSL", "false").lower() == "true"

    @property
    def SQLALCHEMY_DATABASE_URI(self):
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if self.USE_SQLITE:
            db_path = os.path.join(os.path.dirname(__file__), "career_guidance.db")
            return f"sqlite:///{db_path}"
        ssl_args = "?ssl_verify_cert=false" if self.DB_SSL else ""
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}{ssl_args}"
        )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # Firebase
    FIREBASE_SERVICE_ACCOUNT_PATH = os.environ.get(
        "FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json"
    )
    FIREBASE_STORAGE_BUCKET = os.environ.get("FIREBASE_STORAGE_BUCKET", "")

    # OpenAI
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

    # Adzuna
    ADZUNA_APP_ID = os.environ.get("ADZUNA_APP_ID", "")
    ADZUNA_API_KEY = os.environ.get("ADZUNA_API_KEY", "")
    ADZUNA_COUNTRY = os.environ.get("ADZUNA_COUNTRY", "in")

    # JSearch
    JSEARCH_API_KEY = os.environ.get("JSEARCH_API_KEY", "")

    # CORS — comma-separated origins allowed (e.g. "http://localhost:5173,https://myapp.vercel.app")
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

    @property
    def CORS_ORIGINS(self):
        """Return list of allowed origins for CORS."""
        origins = [o.strip() for o in self.FRONTEND_URL.split(",") if o.strip()]
        return origins if origins else ["http://localhost:5173"]

    # ML
    ML_MODELS_DIR = os.path.join(os.path.dirname(__file__), "ml", "models")
    ML_DATASET_PATH = os.path.join(
        os.path.dirname(__file__), "ml", "dataset", "career_data.csv"
    )

    # Upload
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB


class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    DB_NAME = "career_guidance_test"
    JWT_ACCESS_TOKEN_EXPIRES = 9999


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


def get_config():
    env = os.environ.get("FLASK_ENV", "development")
    return config_map.get(env, DevelopmentConfig)()
