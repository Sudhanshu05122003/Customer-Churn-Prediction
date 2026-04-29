# ChurnSense — Customer Churn Prediction Web Application

A portfolio-grade, full-stack web application that predicts customer churn using Machine Learning. Built with a **Flask** backend serving a **Random Forest** model and a modern **Next.js** dashboard.

---

## 📁 Project Structure

```
ChurnSense/
├── backend/                # Flask API (Render Deployment)
│   ├── app.py              # Main API server
│   ├── model.joblib        # Trained ML model
│   ├── scaler.joblib       # Feature scaler
│   ├── requirements.txt    # Python dependencies
│   ├── Procfile            # Render deployment config
│   └── render.yaml         # Blueprint for render deployment
└── frontend-next/          # Next.js Application (Vercel Deployment)
    ├── src/                # React components & logic
    ├── .env.local          # Local environment variables
    └── package.json        # Node dependencies
```

---

## 🚀 Deployment Instructions

### 1. Backend (Render)
- Use the included `render.yaml` blueprint to deploy the Flask API and the PostgreSQL database.
- Alternatively, you can use **Procfile** (`gunicorn app:app`) if deploying manually. Ensure you add `DATABASE_URL`, `JWT_SECRET_KEY` and `FLASK_SECRET_KEY` as environment variables.

### 2. Frontend (Vercel)
- **Framework Preset**: `Next.js`
- **Root Directory**: `frontend-next`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: Set this to your Render backend URL (e.g., `https://churnsense-api.onrender.com`)

---

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, Recharts, Lucide Icons, Vanilla CSS (Glassmorphism)
- **Backend**: Flask, Gunicorn, Scikit-learn, SHAP, Pydantic, PostgreSQL
- **Model**: Random Forest Classifier

---

## 📜 License
MIT License — free for personal and commercial use.
