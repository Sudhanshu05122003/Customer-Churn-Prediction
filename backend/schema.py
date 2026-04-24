"""
ChurnSense — Request/Response Schemas (Pydantic)
==================================================
Strict input validation for all API endpoints.
Prevents malformed data from reaching the model.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


class CustomerFeatures(BaseModel):
    """Schema for a single customer prediction request."""

    Gender: int = Field(..., ge=0, le=2, description="0=Female, 1=Male, 2=Other")
    Age: int = Field(..., ge=18, le=100, description="Customer age (18-100)")
    Tenure: int = Field(..., ge=0, le=12, description="Months with the bank (0-12)")
    Balance: float = Field(..., ge=0, description="Account balance ($)")
    NumOfProducts: int = Field(..., ge=1, le=100, description="Number of products (1-100)")
    HasCrCard: int = Field(..., ge=0, le=1, description="0=No, 1=Yes")
    IsActiveMember: int = Field(..., ge=0, le=1, description="0=No, 1=Yes")
    EstimatedSalary: float = Field(..., ge=0, description="Estimated annual salary ($)")

    @field_validator("Gender")
    @classmethod
    def valid_gender(cls, v):
        if v not in (0, 1, 2):
            raise ValueError("Gender must be 0 (Female), 1 (Male), or 2 (Other)")
        return v

    @field_validator("HasCrCard", "IsActiveMember")
    @classmethod
    def must_be_binary(cls, v):
        if v not in (0, 1):
            raise ValueError("Must be 0 or 1")
        return v

    @field_validator("NumOfProducts")
    @classmethod
    def valid_product_count(cls, v):
        if v < 1:
            raise ValueError("Must have at least 1 product")
        return v



class PredictionResponse(BaseModel):
    """Schema for a single prediction response."""
    prediction: str
    probability: float
    risk_level: str
    features: dict
    explanation: Optional[List[dict]] = None  # SHAP feature explanations


class BulkPredictionResponse(BaseModel):
    """Schema for bulk prediction response."""
    total: int
    churn_count: int
    stay_count: int
    churn_pct: float
    stay_pct: float
    results: List[dict]


class RegisterRequest(BaseModel):
    """Schema for user registration."""
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)
    organization: Optional[str] = Field(None, max_length=100)


class LoginRequest(BaseModel):
    """Schema for user login."""
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)


class APIError(BaseModel):
    """Standardized error response."""
    error: str
    code: int
    details: Optional[str] = None
