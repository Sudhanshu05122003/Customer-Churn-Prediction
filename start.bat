@echo off
title ChurnSense — Customer Churn Prediction
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   ChurnSense — Churn Prediction App      ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Navigate to backend
cd /d "%~dp0backend"

:: Install dependencies
echo [1/3] Installing Python dependencies...
pip install -r requirements.txt
echo.

:: Train model if not already trained
if not exist "model\churn_model.joblib" (
    echo [2/3] Training ML model...
    python train_model.py
    echo.
) else (
    echo [2/3] Model already trained. Skipping.
    echo.
)

:: Start Flask server
echo [3/3] Starting Flask API server...
echo.
echo  Backend  → http://localhost:5000
echo  Frontend → Open frontend/index.html in your browser
echo.
python app.py
