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
│   ├── churn_history.db    # SQLite database
│   ├── requirements.txt    # Python dependencies
│   └── Procfile            # Render deployment config
└── frontend-next/          # Next.js Application (Vercel Deployment)
    ├── src/                # React components & logic
    ├── .env.local          # Local environment variables
    └── package.json        # Node dependencies
```

---

## 🚀 Deployment Instructions

### 1. Backend (Render)
- **Repo Root**: `/backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`

### 2. Frontend (Vercel)
- **Framework Preset**: `Next.js`
- **Root Directory**: `frontend-next`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: Set this to your Render backend URL (e.g., `https://churnsense-api.onrender.com`)

---

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, Recharts, Lucide Icons, Vanilla CSS (Glassmorphism)
- **Backend**: Flask, Gunicorn, Scikit-learn, SHAP, Pydantic, SQLite
- **Model**: Random Forest Classifier

---

## 📜 License
MIT License — free for personal and commercial use.
