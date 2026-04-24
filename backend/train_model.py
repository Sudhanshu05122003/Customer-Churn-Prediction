"""
Customer Churn Prediction — Model Training Script
===================================================
Generates a realistic synthetic dataset modeled after the
Kaggle Bank Customer Churn dataset, then trains a Random Forest
classifier and saves both the model and feature scaler.

Run:  python train_model.py
"""

import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
import joblib

# ──────────────────────────────────────────────
# 1. Generate synthetic dataset
# ──────────────────────────────────────────────
np.random.seed(42)
N = 12_000  # number of samples

print("📊 Generating synthetic customer dataset...")

data = {
    "Gender":           np.random.choice([0, 1], size=N),                    # 0=Female, 1=Male
    "Age":              np.random.randint(18, 75, size=N),
    "Tenure":           np.random.randint(0, 11, size=N),                    # years with bank
    "Balance":          np.round(np.random.uniform(0, 250_000, size=N), 2),
    "NumOfProducts":    np.random.choice([1, 2, 3, 4], size=N, p=[0.5, 0.35, 0.1, 0.05]),
    "HasCrCard":        np.random.choice([0, 1], size=N, p=[0.3, 0.7]),
    "IsActiveMember":   np.random.choice([0, 1], size=N, p=[0.45, 0.55]),
    "EstimatedSalary":  np.round(np.random.uniform(10_000, 200_000, size=N), 2),
}

df = pd.DataFrame(data)

# ──────────────────────────────────────────────
# 2. Create realistic churn labels
#    Churn probability increases with:
#      - higher age, lower tenure, higher balance with low products
#      - inactive members, more than 2 products
# ──────────────────────────────────────────────
logit = (
    -3.0
    + 0.04  * df["Age"]
    - 0.10  * df["Tenure"]
    + 0.000005 * df["Balance"]
    + 0.8   * (df["NumOfProducts"] > 2).astype(int)
    - 0.6   * df["IsActiveMember"]
    + 0.15  * df["Gender"]
    - 0.000002 * df["EstimatedSalary"]
)
churn_prob = 1 / (1 + np.exp(-logit))
# Add noise
churn_prob = np.clip(churn_prob + np.random.normal(0, 0.08, size=N), 0.01, 0.99)
df["Exited"] = (np.random.rand(N) < churn_prob).astype(int)

print(f"   Total samples : {N}")
print(f"   Churn rate    : {df['Exited'].mean():.1%}")

# ──────────────────────────────────────────────
# 3. Train / test split  &  scaling
# ──────────────────────────────────────────────
feature_cols = ["Gender", "Age", "Tenure", "Balance",
                "NumOfProducts", "HasCrCard", "IsActiveMember", "EstimatedSalary"]

X = df[feature_cols]
y = df["Exited"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

# ──────────────────────────────────────────────
# 4. Train Random Forest
# ──────────────────────────────────────────────
print("\n🌲 Training Random Forest classifier...")

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_split=5,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train_scaled, y_train)

# ──────────────────────────────────────────────
# 5. Evaluate
# ──────────────────────────────────────────────
y_pred  = model.predict(X_test_scaled)
y_proba = model.predict_proba(X_test_scaled)[:, 1]

acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_proba)

print(f"\n✅ Accuracy : {acc:.4f}")
print(f"   ROC-AUC  : {auc:.4f}")
print("\n" + classification_report(y_test, y_pred, target_names=["Stay", "Churn"]))

# ──────────────────────────────────────────────
# 6. Save model & scaler
# ──────────────────────────────────────────────
model_dir = os.path.join(os.path.dirname(__file__), "model")
os.makedirs(model_dir, exist_ok=True)

model_path  = os.path.join(model_dir, "churn_model.joblib")
scaler_path = os.path.join(model_dir, "scaler.joblib")

joblib.dump(model,  model_path)
joblib.dump(scaler, scaler_path)

print(f"\n💾 Model  saved → {model_path}")
print(f"   Scaler saved → {scaler_path}")
print("\n🎉 Training complete!")
