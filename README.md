# ChurnSense — Enterprise SaaS Churn Prediction Platform

ChurnSense is a production-grade, full-stack SaaS application that leverages Machine Learning to predict customer churn and provide actionable retention strategies. It features a modern **Next.js** frontend and a robust **Flask** backend with automated ML pipelines.

---

## 🌟 Key Features

- **Multi-Tenant SaaS Architecture**: Built-in JWT authentication with organization-level data isolation and tiered subscription plans (Free/Pro).
- **Custom Model Training (AutoML)**: Organizations can upload their own CSV datasets; the platform automatically detects schemas, handles categorical encoding, and trains a dedicated **Random Forest** model.
- **Explainable AI (SHAP)**: Every prediction includes a feature-level breakdown using SHAP values, visualizing exactly which factors (e.g., balance, tenure) are driving churn risk.
- **Advanced Retention Engine**: Automatically generates personalized intervention strategies (e.g., "Executive Outreach", "High-Yield Rewards") with projected risk-reduction percentages.
- **Bulk Analysis**: High-throughput processing for CSV uploads, allowing for batch predictions across thousands of customers simultaneously.
- **Enterprise Dashboard**: Comprehensive history tracking, real-time statistics, and an interactive onboarding flow for new organizations.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: Vanilla CSS with custom properties (Glassmorphism / Dark Mode)
- **Visuals**: [Recharts](https://recharts.org/) for analytics & [Framer Motion](https://www.framer.com/motion/) for animations
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend & ML
- **API**: [Flask](https://flask.palletsprojects.com/) with [Pydantic](https://docs.pydantic.dev/) for strict validation
- **Database**: [PostgreSQL](https://www.postgresql.org/) for production persistence
- **Machine Learning**: [Scikit-learn](https://scikit-learn.org/) (Random Forest), [SHAP](https://shap.readthedocs.io/) (Explainability)
- **Infrastructure**: Gunicorn (WSGI Server), Structured JSON Logging

---

## 📁 Project Structure

```bash
ChurnSense/
├── backend/                # Python Flask API
│   ├── app.py              # Central API logic & Retention Engine
│   ├── trainer.py          # Custom ML training pipeline
│   ├── auth.py             # JWT & Postgres auth logic
│   ├── model.joblib        # Default industry model
│   ├── custom_models/      # Organization-specific model storage
│   └── render.yaml         # Infrastructure as Code (Render)
└── frontend-next/          # React Next.js Dashboard
    ├── src/app/            # Main pages (Predict, Bulk, History, Train)
    ├── src/components/     # Shared UI components
    └── public/             # Static assets & logos
```

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### 2. Frontend Setup
```bash
cd frontend-next
npm install
npm run dev
```

---

## 📜 License
MIT License — free for personal and commercial use.
