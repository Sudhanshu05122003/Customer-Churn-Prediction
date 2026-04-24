"""
ChurnSense — Centralized Configuration
========================================
Loads settings from .env file with sensible defaults.
All secrets and tunables live here.
"""

import os
from dotenv import load_dotenv

# Load .env from the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class Config:
    """Application configuration loaded from environment."""

    # Flask
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")
    ENV = os.getenv("FLASK_ENV", "development")

    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-dev-secret")
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "24"))

    # Database
    DATABASE_PATH = os.path.join(BASE_DIR, os.getenv("DATABASE_PATH", "churn_history.db"))

    # Model
    MODEL_PATH = os.path.join(BASE_DIR, os.getenv("MODEL_PATH", "model/churn_model.joblib"))
    SCALER_PATH = os.path.join(BASE_DIR, os.getenv("SCALER_PATH", "model/scaler.joblib"))

    # Rate Limiting
    RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "100/hour")
    RATE_LIMIT_PREDICT = os.getenv("RATE_LIMIT_PREDICT", "30/minute")

    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "5000"))

    # Frontend
    FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

    # Feature columns (order matters for model)
    FEATURE_COLS = [
        "Gender", "Age", "Tenure", "Balance",
        "NumOfProducts", "HasCrCard", "IsActiveMember", "EstimatedSalary"
    ]
