from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class LoanApplicationInput(BaseModel):
    """Input schema matching the German Credit dataset features."""

    # Numerical fields
    duration_in_month: int = Field(..., ge=1, le=72, description="Duration of credit in months")
    credit_amount: float = Field(..., gt=0, description="Credit amount in DM")
    installment_rate: int = Field(..., ge=1, le=4, description="Installment rate as % of disposable income")
    present_residence_since: int = Field(..., ge=1, le=4, description="Years at present residence")
    age_in_years: int = Field(..., ge=18, le=100, description="Age of applicant in years")
    number_of_existing_credits: int = Field(..., ge=1, le=4, description="Number of existing credits at this bank")
    number_of_liable_people: int = Field(..., ge=1, le=2, description="Number of people liable to provide maintenance")

    # Categorical fields
    status_of_existing_checking_account: str = Field(..., description="Status of existing checking account")
    credit_history: str = Field(..., description="Credit history of the applicant")
    purpose: str = Field(..., description="Purpose of the credit")
    savings_account_bonds: str = Field(..., description="Savings account / bonds")
    present_employment_since: str = Field(..., description="Present employment duration")
    personal_status_and_sex: str = Field(..., description="Personal status and sex")
    other_debtors_guarantors: str = Field(..., description="Other debtors / guarantors")
    property: str = Field(..., description="Property type")
    other_installment_plans: str = Field(..., description="Other installment plans")
    housing: str = Field(..., description="Housing situation")
    job: str = Field(..., description="Job type")
    telephone: str = Field(..., description="Telephone registered in applicant's name")
    foreign_worker: str = Field(..., description="Foreign worker status")


class ApplicationCreate(BaseModel):
    """Schema for creating a new application."""
    applicant_data: LoanApplicationInput


class ApplicationResponse(BaseModel):
    """Schema for returning application details."""
    id: int
    application_id: str
    created_at: datetime
    status: str
    applicant_data: Optional[str] = None  # JSON string of applicant fields

    model_config = {"from_attributes": True}


class PredictionResponse(BaseModel):
    """Schema for returning ML prediction results."""
    application_id: str
    target_definition: str
    model_version: str
    predicted_class: int
    predicted_label: str
    probability: float
    risk_category: str
    explanation: str
    limitations: List[str]
    analyzed_at: datetime


class AssistantQuery(BaseModel):
    """Schema for sending a question to the AI assistant."""
    question: str = Field(..., min_length=1, description="Question to ask the assistant")


class AssistantResponse(BaseModel):
    """Schema for receiving an answer from the AI assistant."""
    answer: str
    sources: List[str]
