from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/model", tags=["Model Info"])

MODEL_METADATA = {
    "model_name": "CredIntel Loan Risk Classifier",
    "version": "v1.0.0",
    "model_type": "Random Forest Classifier (sklearn Pipeline)",
    "target_definition": {
        "description": "Credit risk classification",
        "class_0": "Good Credit — applicant is likely to repay the loan",
        "class_1": "Bad Credit — applicant is at risk of defaulting",
    },
    "dataset": {
        "name": "South German Credit Dataset (German Credit)",
        "source": "UCI Machine Learning Repository",
        "size": "1000 instances",
        "features": 20,
        "target_distribution": "~70% Good Credit, ~30% Bad Credit",
        "era": "1970s–1980s, West Germany",
    },
    "features_used": [
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
    ],
    "preprocessing": {
        "numerical": "StandardScaler",
        "categorical": "OneHotEncoder (handle_unknown='ignore')",
    },
    "hyperparameters": {
        "n_estimators": 100,
        "max_depth": 10,
        "random_state": 42,
    },
    "limitations": [
        "Trained on historical data from 1970s–1980s Germany; demographic and economic context differs from modern lending.",
        "Not suitable as the sole decision-making tool — use as a decision-support aid only.",
        "Categorical values must match the training dataset encoding exactly.",
        "Does not account for macroeconomic conditions or behavioral credit data.",
        "Potential for demographic bias — consult a fairness audit before production deployment.",
    ],
}


@router.get("/info", tags=["Model Info"])
def get_model_info():
    """Return metadata about the currently deployed ML model."""
    return {
        **MODEL_METADATA,
        "queried_at": datetime.now(timezone.utc).isoformat(),
    }
