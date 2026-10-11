import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
from datetime import datetime, timezone

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "loan_model_v1.joblib")
MODEL_VERSION = "v1.0.0"

# Column mapping from schema field names to dataset column names
COLUMN_MAPPING = {
    "status_of_existing_checking_account": "Status_of_existing_checking_account",
    "duration_in_month": "Duration_in_month",
    "credit_history": "Credit_history",
    "purpose": "Purpose",
    "credit_amount": "Credit_amount",
    "savings_account_bonds": "Savings_account_bonds",
    "present_employment_since": "Present_employment_since",
    "installment_rate": "Installment_rate_in_percentage_of_disposable_income",
    "personal_status_and_sex": "Personal_status_and_sex",
    "other_debtors_guarantors": "Other_debtors_guarantors",
    "present_residence_since": "Present_residence_since",
    "property": "Property",
    "age_in_years": "Age_in_years",
    "other_installment_plans": "Other_installment_plans",
    "housing": "Housing",
    "number_of_existing_credits": "Number_of_existing_credits_at_this_bank",
    "job": "Job",
    "number_of_liable_people": "Number_of_people_being_liable_to_provide_maintenance_for",
    "telephone": "Telephone",
    "foreign_worker": "foreign_worker",
}

# Exact column order expected by the model (as trained)
EXPECTED_COLUMNS = [
    "Status_of_existing_checking_account",
    "Duration_in_month",
    "Credit_history",
    "Purpose",
    "Credit_amount",
    "Savings_account_bonds",
    "Present_employment_since",
    "Installment_rate_in_percentage_of_disposable_income",
    "Personal_status_and_sex",
    "Other_debtors_guarantors",
    "Present_residence_since",
    "Property",
    "Age_in_years",
    "Other_installment_plans",
    "Housing",
    "Number_of_existing_credits_at_this_bank",
    "Job",
    "Number_of_people_being_liable_to_provide_maintenance_for",
    "Telephone",
    "foreign_worker",
]


class LoanPredictor:
    """ML predictor service for loan application risk assessment."""

    def __init__(self) -> None:
        self._model = None
        self._loaded = False
        self._load_error: Optional[str] = None
        self._load_model()

    def _load_model(self) -> None:
        """Load the trained joblib model pipeline."""
        try:
            if not os.path.exists(MODEL_PATH):
                self._load_error = f"Model file not found at: {MODEL_PATH}"
                return
            self._model = joblib.load(MODEL_PATH)
            self._loaded = True
            print(f"[LoanPredictor] Model loaded successfully from {MODEL_PATH}")
        except Exception as exc:
            self._load_error = str(exc)
            print(f"[LoanPredictor] ERROR loading model: {exc}")

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def load_error(self) -> Optional[str]:
        return self._load_error

    def _map_input(self, data: Dict[str, Any]) -> pd.DataFrame:
        """Map schema field names to dataset column names and return a DataFrame."""
        mapped: Dict[str, Any] = {}
        for schema_key, column_name in COLUMN_MAPPING.items():
            if schema_key in data:
                mapped[column_name] = data[schema_key]
            else:
                raise ValueError(f"Missing field in input data: '{schema_key}'")
        # Ensure correct column order
        df = pd.DataFrame([mapped])[EXPECTED_COLUMNS]
        return df

    def _get_risk_category(self, default_probability: float) -> str:
        """
        Classify risk based on the probability of default (class 1 = bad credit).
        HIGH risk  => default probability >= 0.7
        MEDIUM risk => 0.4 <= default probability < 0.7
        LOW risk   => default probability < 0.4
        """
        if default_probability >= 0.70:
            return "HIGH"
        elif default_probability >= 0.40:
            return "MEDIUM"
        else:
            return "LOW"

    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run the ML pipeline on the provided input dictionary.

        Returns a dict containing:
            predicted_class: int (1 = bad credit / likely to default, 0 = good credit)
            probability: float (probability of being class 1 / bad credit)
            risk_category: str (HIGH / MEDIUM / LOW)
            model_version: str
        """
        if not self._loaded:
            raise RuntimeError(
                f"Model is not loaded. Reason: {self._load_error or 'unknown'}"
            )

        df = self._map_input(data)
        predicted_class = int(self._model.predict(df)[0])
        probas = self._model.predict_proba(df)[0]

        # Class index for "bad credit" (1) is at index 1 in the probability array
        # The model was trained with Target: 1=bad, 2=good  (or 0/1 depending on encoding)
        # We use the probability of the positive class (higher index)
        classes = self._model.classes_
        if 1 in classes:
            bad_idx = list(classes).index(1)
        else:
            bad_idx = 1  # fallback

        bad_probability = float(probas[bad_idx])
        risk_category = self._get_risk_category(bad_probability)

        return {
            "predicted_class": predicted_class,
            "probability": bad_probability,
            "risk_category": risk_category,
            "model_version": MODEL_VERSION,
        }


# Singleton instance — loaded once at module import time
predictor = LoanPredictor()
