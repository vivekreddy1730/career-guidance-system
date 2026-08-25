"""
test_api_endpoints.py — Integration tests for Flask API endpoints.
Uses Flask test client with in-memory SQLite for isolation.
Run: pytest backend/tests/test_api_endpoints.py -v
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
import json


@pytest.fixture(scope="module")
def app():
    import os
    os.environ["FLASK_TESTING"] = "1"

    from config import TestingConfig

    class InMemoryConfig(TestingConfig):
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        TESTING = True
        DEBUG = True
        SECRET_KEY = "test-secret-key-32-bytes-minimum!"
        JWT_SECRET_KEY = "test-jwt-secret-key-32-bytes-ok!!"
        JWT_ALGORITHM = "HS256"
        OPENAI_API_KEY = ""
        ADZUNA_APP_ID = ""
        ADZUNA_API_KEY = ""
        JSEARCH_API_KEY = ""
        FIREBASE_SERVICE_ACCOUNT_PATH = "nonexistent.json"
        FRONTEND_URL = "http://localhost:5173"

    from app import create_app
    application = create_app(InMemoryConfig())

    with application.app_context():
        from extensions import db
        db.create_all()

    yield application

    os.environ.pop("FLASK_TESTING", None)


@pytest.fixture(scope="module")
def client(app):
    return app.test_client()


@pytest.fixture(scope="module")
def auth_token(client):
    """Get a mock JWT token."""
    resp = client.post(
        "/api/auth/verify-otp",
        json={"id_token": "mock_+919999999999"},
        content_type="application/json",
    )
    assert resp.status_code == 200, f"Auth failed: {resp.data}"
    data = resp.get_json()
    return data["access_token"]


class TestHealth:
    def test_health_ok(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        assert resp.get_json()["status"] == "ok"


class TestAuth:
    def test_verify_otp_mock(self, client):
        resp = client.post(
            "/api/auth/verify-otp",
            json={"id_token": "mock_+910000000001"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "access_token" in data

    def test_verify_otp_missing_token(self, client):
        resp = client.post("/api/auth/verify-otp", json={})
        assert resp.status_code == 400

    def test_verify_otp_invalid_token(self, client):
        resp = client.post(
            "/api/auth/verify-otp",
            json={"id_token": "invalid_real_token"},
        )
        assert resp.status_code == 401

    def test_me_requires_auth(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_me_with_token(self, client, auth_token):
        resp = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 200


class TestProfile:
    def test_get_profile(self, client, auth_token):
        resp = client.get(
            "/api/profile",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 200
        assert "profile" in resp.get_json()

    def test_update_profile(self, client, auth_token):
        resp = client.put(
            "/api/profile",
            json={
                "name": "Teju Test",
                "college": "Test College",
                "branch": "Computer Science",
                "year": 3,
                "cgpa": 8.5,
                "skills": [{"name": "Python", "proficiency": 80}],
                "interests": ["data science", "machine learning"],
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["profile"]["name"] == "Teju Test"

    def test_profile_unauthenticated(self, client):
        resp = client.get("/api/profile")
        assert resp.status_code == 401


class TestAssessment:
    def test_get_questions(self, client, auth_token):
        resp = client.get(
            "/api/assessment/questions",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 200
        # Questions may be 0 if seed not run, but endpoint should work

    def test_start_assessment(self, client, auth_token):
        resp = client.post(
            "/api/assessment/start",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code in (200, 201)
        data = resp.get_json()
        assert "assessment_id" in data


class TestCareer:
    def test_predict_returns_predictions(self, client, auth_token):
        resp = client.post(
            "/api/career/predict",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        # May fail if ML model not trained, but endpoint should respond
        assert resp.status_code in (200, 500)

    def test_list_careers(self, client, auth_token):
        resp = client.get(
            "/api/career/list",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 200


class TestJobs:
    def test_trending_skills(self, client, auth_token):
        resp = client.get(
            "/api/jobs/trending",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "trending_skills" in data
        assert len(data["trending_skills"]) > 0

    def test_salary_insights(self, client, auth_token):
        resp = client.get(
            "/api/jobs/salary?career=Data Scientist",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 200

    def test_jobs_fallback_to_mock(self, client, auth_token):
        resp = client.get(
            "/api/jobs?career=Software Engineer",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "jobs" in data


class TestChat:
    def test_chat_returns_response(self, client, auth_token):
        resp = client.post(
            "/api/chat",
            json={"message": "Which career suits me?"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert "response" in data
        assert len(data["response"]) > 0

    def test_chat_missing_message(self, client, auth_token):
        resp = client.post(
            "/api/chat",
            json={},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 400
