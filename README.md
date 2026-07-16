# ChurnSense — Enterprise SaaS Customer Intelligence Platform

ChurnSense is a production-grade, full-stack enterprise SaaS platform leveraging Machine Learning to predict customer churn, estimate lifetime value (CLV), flag retention opportunities, and run simulated campaigns.

---

## 🌟 Key Enterprise Features

- **Multi-Model AutoML Pipeline**: Trains Random Forest, Gradient Boosting, and Logistic Regression models side-by-side, picking the best model based on F1/Accuracy.
- **Model Versioning & Registry**: Checkpoint model training runs (v1.0, v2.0) and dynamically roll back to previous active states.
- **MLOps Drift Detection**: Monitors Kolmogorov-Smirnov statistics on input metrics to detect feature distribution data drift.
- **Explainable AI (SHAP)**: Renders global feature importances, individual waterfall attributions, and scatter dependence charts.
- **Data Quality Dashboard**: Scans uploaded CSVs for missing values, outlier values, and duplicate rows, recommending auto-repairs.
- **Scenario Campaign Simulator & AI Copilot**: Run interactive campaign simulations and query client intelligence in real-time.
- **Developer Webhooks**: Configure real-time HTTP POST notification callbacks triggered by critical risk score fluctuations.
- **Audit Logging**: Track authentication logins, model builds, uploads, and campaigns.
- **REST API Specs**: Complete interactive OpenAPI specifications generated dynamically at `/api/developer/docs`.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: Vanilla CSS (Sleek Dark Mode / Glassmorphism)
- **Visuals**: [Recharts](https://recharts.org/) for BI charts & analytics
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend & ML
- **API**: [Flask](https://flask.palletsprojects.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Machine Learning**: [Scikit-learn](https://scikit-learn.org/), [SHAP](https://shap.readthedocs.io/)
- **Infrastructure**: Gunicorn, Docker Compose, structured logging

---

## 📁 Project Structure

```bash
ChurnSense/
├── backend/                # Python Flask API
│   ├── app.py              # Main API routes
│   ├── trainer.py          # AutoML comparison pipeline
│   ├── mlops_tracker.py    # Experiment tracking & data drift metrics
│   ├── quality_analyzer.py # Data quality profiling
│   ├── report_generator.py # Executive HTML business report generator
│   └── test_suite.py       # Automated unit test suite
├── frontend-next/          # React Next.js Dashboard
│   ├── src/app/            # Main pages (Dashboard, Quality, Explainability, etc.)
│   └── src/lib/api.js      # API client wrappers
├── Dockerfile              # Backend container configuration
└── docker-compose.yml      # Orchestration composer
```

---

## 🚀 Quick Start (Docker Compose)

Launch the entire stack (PostgreSQL, Flask Backend, and Next.js Frontend) in one command:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

---

## 🧪 Automated Testing

Validate all authentication, quality analyzers, and marketing campaign endpoints:

```bash
cd backend
python test_suite.py
```

---

## 📜 License
MIT License.
