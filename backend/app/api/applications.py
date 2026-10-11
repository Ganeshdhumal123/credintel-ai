import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db, Application, PredictionResult, AuditEvent
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    PredictionResponse,
    LoanApplicationInput,
)
from app.ml.predictor import predictor

router = APIRouter(prefix="/api/v1/applications", tags=["Applications"])


@router.post("", response_model=ApplicationResponse, status_code=201)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)):
    """
    Submit a new loan application.

    Stores applicant data and returns the created application record.
    """
    application_id = str(uuid.uuid4())
    applicant_json = payload.applicant_data.model_dump_json()

    db_app = Application(
        application_id=application_id,
        status="pending",
        applicant_data=applicant_json,
    )
    db.add(db_app)

    audit = AuditEvent(
        event_type="APPLICATION_CREATED",
        application_id=application_id,
        details=f"New application created with id={application_id}",
    )
    db.add(audit)
    db.commit()
    db.refresh(db_app)
    return db_app


@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List all loan applications with pagination."""
    apps = db.query(Application).offset(skip).limit(limit).all()
    return apps


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(application_id: str, db: Session = Depends(get_db)):
    """Retrieve a single application by its UUID."""
    db_app = (
        db.query(Application)
        .filter(Application.application_id == application_id)
        .first()
    )
    if not db_app:
        raise HTTPException(status_code=404, detail=f"Application '{application_id}' not found.")
    return db_app


@router.post("/{application_id}/analyze", response_model=PredictionResponse)
def analyze_application(application_id: str, db: Session = Depends(get_db)):
    """
    Run the ML model on a submitted application and return the risk prediction.

    - predicted_class 1 = Bad credit (likely to default)
    - predicted_class 0 = Good credit (unlikely to default)
    """
    db_app = (
        db.query(Application)
        .filter(Application.application_id == application_id)
        .first()
    )
    if not db_app:
        raise HTTPException(status_code=404, detail=f"Application '{application_id}' not found.")

    if not db_app.applicant_data:
        raise HTTPException(status_code=422, detail="Application has no applicant data to analyze.")

    if not predictor.is_loaded:
        raise HTTPException(
            status_code=503,
            detail=f"ML model is not available: {predictor.load_error}",
        )

    # Parse applicant data
    try:
        data_dict = json.loads(db_app.applicant_data)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to parse applicant data: {exc}")

    # Run prediction
    try:
        result = predictor.predict(data_dict)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction error: {exc}")

    predicted_class = result["predicted_class"]
    probability = result["probability"]
    risk_category = result["risk_category"]
    model_version = result["model_version"]

    predicted_label = "Bad Credit Risk" if predicted_class == 1 else "Good Credit Risk"

    explanation = (
        f"The model predicts this applicant is '{predicted_label}' with a default probability "
        f"of {probability:.1%}. Risk is classified as '{risk_category}' based on the supplied "
        f"financial and personal attributes."
    )

    limitations = [
        "Model trained on historical German Credit data (1970s–1980s); may not reflect current lending norms.",
        "Categorical encoding relies on exact string matches from the training dataset.",
        "Does not account for macroeconomic conditions or recent financial events.",
        "Should be used as a decision-support tool, not as the sole basis for credit decisions.",
    ]

    analyzed_at = datetime.now(timezone.utc)

    # Persist prediction
    db_pred = PredictionResult(
        application_id=application_id,
        prediction=predicted_class,
        probability=probability,
        risk_category=risk_category,
        model_version=model_version,
        analyzed_at=analyzed_at,
        explanation=explanation,
    )
    db.add(db_pred)

    # Update application status
    db_app.status = "analyzed"

    # Audit
    audit = AuditEvent(
        event_type="APPLICATION_ANALYZED",
        application_id=application_id,
        details=f"Prediction: class={predicted_class}, prob={probability:.4f}, risk={risk_category}",
    )
    db.add(audit)
    db.commit()

    return PredictionResponse(
        application_id=application_id,
        target_definition="1 = Bad Credit (likely to default), 0 = Good Credit (unlikely to default)",
        model_version=model_version,
        predicted_class=predicted_class,
        predicted_label=predicted_label,
        probability=probability,
        risk_category=risk_category,
        explanation=explanation,
        limitations=limitations,
        analyzed_at=analyzed_at,
    )
