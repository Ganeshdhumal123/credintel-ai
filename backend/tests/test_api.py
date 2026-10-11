"""
Test suite for CredIntel AI backend.
Run with: python -m pytest tests/ -v
"""
import json
import sys
import os
import pytest

# Ensure the backend app is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.ml.predictor import predictor

client = TestClient(app)

SAMPLE_APPLICATION = {
    "applicant_data": {
        "duration_in_month": 24,
        "credit_amount": 5000.0,
        "installment_rate": 3,
        "present_residence_since": 2,
        "age_in_years": 35,
        "number_of_existing_credits": 1,
        "number_of_liable_people": 1,
        "status_of_existing_checking_account": "A11",
        "credit_history": "A32",
        "purpose": "A43",
        "savings_account_bonds": "A61",
        "present_employment_since": "A73",
        "personal_status_and_sex": "A93",
        "other_debtors_guarantors": "A101",
        "property": "A121",
        "other_installment_plans": "A143",
        "housing": "A152",
        "job": "A173",
        "telephone": "A191",
        "foreign_worker": "A201",
    }
}


# ────────────────────────────────────────────────────────────────────────────
# Health & system endpoints
# ────────────────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_has_status_ok(self):
        response = client.get("/health")
        data = response.json()
        assert data["status"] == "ok"

    def test_health_has_version(self):
        response = client.get("/health")
        data = response.json()
        assert "version" in data


class TestModelInfo:
    def test_model_info_returns_200(self):
        response = client.get("/api/v1/model/info")
        assert response.status_code == 200

    def test_model_info_has_required_fields(self):
        response = client.get("/api/v1/model/info")
        data = response.json()
        assert "model_name" in data or "algorithm" in data or "version" in data


# ────────────────────────────────────────────────────────────────────────────
# Model loading
# ────────────────────────────────────────────────────────────────────────────

class TestModelLoading:
    def test_predictor_is_loaded(self):
        assert predictor.is_loaded is True, f"Model not loaded: {predictor.load_error}"

    def test_predictor_load_error_is_none(self):
        assert predictor.load_error is None


# ────────────────────────────────────────────────────────────────────────────
# Input validation
# ────────────────────────────────────────────────────────────────────────────

class TestInputValidation:
    def test_missing_required_field_returns_422(self):
        bad_payload = {"applicant_data": {"duration_in_month": 24}}  # missing many fields
        response = client.post("/api/v1/applications", json=bad_payload)
        assert response.status_code == 422

    def test_duration_below_minimum_returns_422(self):
        payload = json.loads(json.dumps(SAMPLE_APPLICATION))
        payload["applicant_data"]["duration_in_month"] = 0  # below ge=1
        response = client.post("/api/v1/applications", json=payload)
        assert response.status_code == 422

    def test_age_below_minimum_returns_422(self):
        payload = json.loads(json.dumps(SAMPLE_APPLICATION))
        payload["applicant_data"]["age_in_years"] = 10  # below ge=18
        response = client.post("/api/v1/applications", json=payload)
        assert response.status_code == 422

    def test_negative_credit_amount_returns_422(self):
        payload = json.loads(json.dumps(SAMPLE_APPLICATION))
        payload["applicant_data"]["credit_amount"] = -100.0
        response = client.post("/api/v1/applications", json=payload)
        assert response.status_code == 422


# ────────────────────────────────────────────────────────────────────────────
# Applications CRUD
# ────────────────────────────────────────────────────────────────────────────

class TestApplications:
    def test_create_application_returns_201(self):
        response = client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
        assert response.status_code == 201

    def test_create_application_returns_application_id(self):
        response = client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
        data = response.json()
        assert "application_id" in data
        assert len(data["application_id"]) == 36  # UUID format

    def test_create_application_status_is_pending(self):
        response = client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
        data = response.json()
        assert data["status"] == "pending"

    def test_list_applications_returns_200(self):
        response = client.get("/api/v1/applications")
        assert response.status_code == 200

    def test_list_applications_returns_list(self):
        response = client.get("/api/v1/applications")
        data = response.json()
        assert isinstance(data, list)

    def test_get_nonexistent_application_returns_404(self):
        response = client.get("/api/v1/applications/non-existent-id-12345")
        assert response.status_code == 404

    def test_get_existing_application_returns_200(self):
        create_resp = client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
        app_id = create_resp.json()["application_id"]
        get_resp = client.get(f"/api/v1/applications/{app_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["application_id"] == app_id


# ────────────────────────────────────────────────────────────────────────────
# Prediction endpoint
# ────────────────────────────────────────────────────────────────────────────

class TestPrediction:
    def _create_app(self):
        response = client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
        assert response.status_code == 201
        return response.json()["application_id"]

    def test_analyze_returns_200(self):
        app_id = self._create_app()
        response = client.post(f"/api/v1/applications/{app_id}/analyze")
        assert response.status_code == 200

    def test_analyze_returns_predicted_class(self):
        app_id = self._create_app()
        response = client.post(f"/api/v1/applications/{app_id}/analyze")
        data = response.json()
        assert "predicted_class" in data
        assert data["predicted_class"] in [0, 1]

    def test_analyze_returns_probability(self):
        app_id = self._create_app()
        response = client.post(f"/api/v1/applications/{app_id}/analyze")
        data = response.json()
        assert "probability" in data
        assert 0.0 <= data["probability"] <= 1.0

    def test_analyze_returns_risk_category(self):
        app_id = self._create_app()
        response = client.post(f"/api/v1/applications/{app_id}/analyze")
        data = response.json()
        assert "risk_category" in data
        assert data["risk_category"] in ["LOW", "MEDIUM", "HIGH"]

    def test_analyze_returns_limitations(self):
        app_id = self._create_app()
        response = client.post(f"/api/v1/applications/{app_id}/analyze")
        data = response.json()
        assert "limitations" in data
        assert isinstance(data["limitations"], list)
        assert len(data["limitations"]) > 0

    def test_analyze_nonexistent_app_returns_404(self):
        response = client.post("/api/v1/applications/does-not-exist-abc/analyze")
        assert response.status_code == 404

    def test_analyze_updates_status_to_analyzed(self):
        app_id = self._create_app()
        client.post(f"/api/v1/applications/{app_id}/analyze")
        get_resp = client.get(f"/api/v1/applications/{app_id}")
        assert get_resp.json()["status"] == "analyzed"


# ────────────────────────────────────────────────────────────────────────────
# Database persistence
# ────────────────────────────────────────────────────────────────────────────

class TestDatabasePersistence:
    def test_application_appears_in_list_after_creation(self):
        create_resp = client.post("/api/v1/applications", json=SAMPLE_APPLICATION)
        app_id = create_resp.json()["application_id"]
        # Use a large limit to ensure the new application is visible
        list_resp = client.get("/api/v1/applications?limit=100")
        ids = [a["application_id"] for a in list_resp.json()]
        assert app_id in ids



# ────────────────────────────────────────────────────────────────────────────
# RAG / Assistant
# ────────────────────────────────────────────────────────────────────────────

class TestAssistant:
    def test_query_returns_200(self):
        response = client.post("/api/v1/assistant/query", json={"question": "What are the risk categories?"})
        assert response.status_code == 200

    def test_query_returns_answer_field(self):
        response = client.post("/api/v1/assistant/query", json={"question": "What are the risk categories?"})
        data = response.json()
        assert "answer" in data
        assert len(data["answer"]) > 0

    def test_query_returns_sources_list(self):
        response = client.post("/api/v1/assistant/query", json={"question": "Tell me about the model"})
        data = response.json()
        assert "sources" in data
        assert isinstance(data["sources"], list)

    def test_query_never_returns_500(self):
        """Even with an unusual question, the assistant must not return 500."""
        response = client.post("/api/v1/assistant/query", json={"question": "XYZ completely unknown topic 12345"})
        assert response.status_code == 200

    def test_empty_question_returns_graceful_response(self):
        """Empty question after strip should get a helpful prompt."""
        response = client.post("/api/v1/assistant/query", json={"question": "  "})
        # Either 422 (validation) or 200 with a helpful message — never 500
        assert response.status_code in [200, 422]


# ────────────────────────────────────────────────────────────────────────────
# API error handling
# ────────────────────────────────────────────────────────────────────────────

class TestAPIErrorHandling:
    def test_invalid_json_body_returns_422(self):
        response = client.post(
            "/api/v1/applications",
            data="not valid json",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 422

    def test_unknown_route_returns_404(self):
        response = client.get("/api/v1/nonexistent-route")
        assert response.status_code == 404
