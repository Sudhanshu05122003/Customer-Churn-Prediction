# ChurnSense — Customer Churn Prediction Web Application

A portfolio-grade, full-stack web application that predicts customer churn using Machine Learning. Built with a **Flask** backend serving a **Random Forest** model and a modern **HTML/CSS/JS** dashboard frontend.

![Dashboard](https://img.shields.io/badge/UI-Dashboard-6366f1) ![Python](https://img.shields.io/badge/Python-3.9+-3776ab) ![Flask](https://img.shields.io/badge/Flask-3.1-000000) ![scikit--learn](https://img.shields.io/badge/scikit--learn-1.6-f7931e)

---

## ✨ Features

### 🔮 Manual Prediction
- Enter individual customer details (Gender, Age, Tenure, Balance, etc.)
- Get instant churn/stay prediction with probability score
- Animated probability ring visualization

### 📊 Bulk CSV Prediction
- Drag-and-drop CSV upload
- Processes hundreds of records at once
- Color-coded results table (red = high churn risk)
- Download results as CSV
- Summary statistics (total, churn %, stay %)

### 📈 Dashboard Analytics
- Real-time stat cards with animated counters
- Churn distribution doughnut chart
- Prediction trend line chart
- Recent predictions table

### 📜 Prediction History
- All predictions stored in SQLite database
- Filterable history view with source tags (Manual / CSV)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- pip

### Option 1: One-Click Start (Windows)
```bash
double-click start.bat
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Train the ML model
python train_model.py

# 3. Start the API server
python app.py

# 4. Open frontend in browser
# Open frontend/index.html in your web browser
```

The API runs at `http://localhost:5000` and the frontend connects to it automatically.

---

## 📁 Project Structure
```
Customer Churn Prediction/
├── backend/
│   ├── app.py              # Flask API server
│   ├── train_model.py      # Model training script
│   ├── requirements.txt    # Python dependencies
│   ├── model/
│   │   ├── churn_model.joblib  # Trained Random Forest model
│   │   └── scaler.joblib       # Feature scaler
│   └── churn_history.db    # SQLite prediction history
├── frontend/
│   ├── index.html          # Dashboard HTML
│   ├── css/
│   │   └── style.css       # Design system & styles
│   └── js/
│       └── app.js          # Application logic
├── sample_data.csv         # Sample CSV for testing
├── start.bat               # One-click launcher
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/predict` | Single customer prediction (JSON) |
| POST | `/predict-bulk` | Bulk prediction (CSV file upload) |
| GET | `/history?limit=50` | Prediction history |
| GET | `/stats` | Dashboard aggregate statistics |

### Example: Single Prediction
```json
POST /predict
{
    "Gender": 1,
    "Age": 42,
    "Tenure": 3,
    "Balance": 75000,
    "NumOfProducts": 2,
    "HasCrCard": 1,
    "IsActiveMember": 0,
    "EstimatedSalary": 120000
}
```

### Response
```json
{
    "prediction": "Churn",
    "probability": 0.7234,
    "features": { ... }
}
```

---

## 🧠 ML Model

- **Algorithm**: Random Forest Classifier (200 trees)
- **Dataset**: Synthetic (12,000 samples, modeled after Kaggle Bank Churn)
- **Features**: Gender, Age, Tenure, Balance, NumOfProducts, HasCrCard, IsActiveMember, EstimatedSalary
- **Preprocessing**: StandardScaler normalization
- **Performance**: ~80% accuracy, balanced class weights

---

## 🎨 UI Design

- Dark theme with glassmorphism cards
- Gradient accents (Indigo → Violet)
- Responsive layout (mobile-friendly)
- Animated stat counters and probability ring
- Toast notifications
- Loading overlays with spinner

---

## 📄 CSV Format

Your CSV file must include these columns:

```
Gender,Age,Tenure,Balance,NumOfProducts,HasCrCard,IsActiveMember,EstimatedSalary
1,42,3,75000,2,1,0,120000
0,28,7,0,1,1,1,85000
```

- **Gender**: 0 = Female, 1 = Male
- **HasCrCard**: 0 = No, 1 = Yes
- **IsActiveMember**: 0 = No, 1 = Yes

---

## 📜 License

MIT License — free for personal and commercial use.
