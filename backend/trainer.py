"""
ChurnSense — Custom Model Trainer
====================================
Allows any organization to upload their own historical data
and train a custom Random Forest model for churn prediction.

Features:
  ✓ Auto-detect categorical vs numeric columns
  ✓ Label-encode categoricals
  ✓ Train RandomForest with balanced classes
  ✓ Save model + scaler + metadata per organization
  ✓ Return accuracy metrics
"""

import os
import json
import time
import logging
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
import joblib

logger = logging.getLogger("churnsense")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CUSTOM_MODELS_DIR = os.path.join(BASE_DIR, "custom_models")


def get_model_dir(org_id):
    """Get or create the model directory for an organization."""
    model_dir = os.path.join(CUSTOM_MODELS_DIR, str(org_id))
    os.makedirs(model_dir, exist_ok=True)
    return model_dir


def analyze_columns(df):
    """Analyze a DataFrame and classify columns as numeric or categorical."""
    analysis = []
    for col in df.columns:
        col_info = {
            "name": col,
            "dtype": str(df[col].dtype),
            "unique_count": int(df[col].nunique()),
            "null_count": int(df[col].isnull().sum()),
            "null_pct": round(float(df[col].isnull().mean()) * 100, 1),
            "sample_values": [str(v) for v in df[col].dropna().head(5).tolist()],
        }

        # Classify column type
        if df[col].dtype in ('int64', 'int32', 'float64', 'float32'):
            col_info["suggested_type"] = "numeric"
        elif df[col].nunique() <= 20:
            col_info["suggested_type"] = "categorical"
        else:
            col_info["suggested_type"] = "text"  # might need to drop or encode

        analysis.append(col_info)
    return analysis


def train_custom_model(df, feature_cols, target_col, org_id):
    """
    Train a custom churn model from user-provided data.

    Args:
        df: pandas DataFrame with the full dataset
        feature_cols: list of column names to use as features
        target_col: name of the column containing churn labels (0/1 or text)
        org_id: unique identifier for the organization

    Returns:
        dict with training results and metrics
    """
    start_time = time.time()
    model_dir = get_model_dir(org_id)

    # ─── Validate inputs ─────────────────────────
    missing = [c for c in feature_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Feature columns not found in data: {missing}")
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in data")

    # ─── Prepare target ──────────────────────────
    y = df[target_col].copy()

    # Auto-detect and encode target if it's text
    target_mapping = None
    if y.dtype == 'object' or y.dtype.name == 'category':
        unique_vals = y.dropna().unique()
        if len(unique_vals) != 2:
            raise ValueError(
                f"Target column must have exactly 2 unique values (got {len(unique_vals)}). "
                f"Values found: {list(unique_vals[:10])}"
            )
        # Try to auto-detect which is "churn" (1) vs "stay" (0)
        churn_keywords = {'churn', 'yes', 'true', 'left', 'exit', 'exited', 'churned', '1',
                          'leave', 'gone', 'lost', 'cancelled', 'canceled', 'inactive'}
        stay_keywords = {'stay', 'no', 'false', 'retained', 'active', '0', 'remaining', 'kept'}

        val_lower = {str(v).lower().strip(): v for v in unique_vals}
        churn_val = None
        stay_val = None

        for key, orig in val_lower.items():
            if key in churn_keywords:
                churn_val = orig
            elif key in stay_keywords:
                stay_val = orig

        if churn_val is None or stay_val is None:
            # Fallback: alphabetical, second value = churn (1)
            sorted_vals = sorted(unique_vals, key=str)
            stay_val, churn_val = sorted_vals[0], sorted_vals[1]

        target_mapping = {str(stay_val): 0, str(churn_val): 1}
        y = y.map({stay_val: 0, churn_val: 1})
        logger.info(f"Target encoding: {stay_val}=Stay(0), {churn_val}=Churn(1)")
    else:
        # Numeric — ensure 0/1
        unique_vals = sorted(y.dropna().unique())
        if set(unique_vals) != {0, 1} and len(unique_vals) == 2:
            target_mapping = {str(unique_vals[0]): 0, str(unique_vals[1]): 1}
            y = y.map({unique_vals[0]: 0, unique_vals[1]: 1})

    # Drop rows with null target
    valid_mask = y.notna()
    y = y[valid_mask].astype(int)
    df = df[valid_mask]

    # ─── Prepare features ────────────────────────
    X = df[feature_cols].copy()
    label_encoders = {}
    feature_metadata = []

    for col in feature_cols:
        col_meta = {"name": col, "original_dtype": str(X[col].dtype)}

        is_categorical = False
        if X[col].dtype == 'object' or X[col].dtype.name == 'category':
            is_categorical = True
        elif pd.api.types.is_numeric_dtype(X[col]) and X[col].dropna().nunique() <= 2:
            is_categorical = True

        if is_categorical:
            # Label encode categorical columns
            le = LabelEncoder()
            # Convert to string and fill NaN with a placeholder
            def clean_val(v):
                if pd.isna(v): return "_MISSING_"
                try: 
                    f = float(v)
                    return str(int(f)) if f.is_integer() else str(v)
                except (ValueError, TypeError): 
                    return str(v)

            X[col] = X[col].apply(clean_val)
            X[col] = le.fit_transform(X[col])
            label_encoders[col] = le
            col_meta["type"] = "categorical"
            col_meta["categories"] = [str(c) for c in le.classes_.tolist()]
        else:
            # Numeric
            X[col] = pd.to_numeric(X[col], errors='coerce').fillna(0)
            col_meta["type"] = "numeric"
            col_meta["min"] = float(X[col].min())
            col_meta["max"] = float(X[col].max())
            col_meta["mean"] = round(float(X[col].mean()), 2)

        feature_metadata.append(col_meta)

    # ─── Minimum data check ──────────────────────
    if len(X) < 20:
        raise ValueError(
            f"Dataset too small ({len(X)} rows). Need at least 20 rows for training."
        )

    # ─── Warning for small datasets ──────────────
    warnings = []
    if len(X) < 100:
        warnings.append(f"Small dataset ({len(X)} rows). Model accuracy may be limited.")

    churn_rate = y.mean()
    if churn_rate < 0.05 or churn_rate > 0.95:
        warnings.append(
            f"Heavily imbalanced data ({churn_rate:.1%} churn rate). "
            "Results may be biased. Using balanced class weights to compensate."
        )

    # ─── Train/test split & scaling ──────────────
    test_size = 0.2 if len(X) >= 50 else 0.3
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42,
        stratify=y if y.nunique() == 2 and y.value_counts().min() >= 2 else None
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ─── Train model ─────────────────────────────
    n_estimators = min(200, max(50, len(X) // 5))
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=min(12, max(3, len(feature_cols))),
        min_samples_split=max(2, len(X) // 100),
        min_samples_leaf=max(1, len(X) // 200),
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train_scaled, y_train)

    # ─── Evaluate ────────────────────────────────
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]

    accuracy = round(accuracy_score(y_test, y_pred), 4)
    try:
        auc = round(roc_auc_score(y_test, y_proba), 4)
    except ValueError:
        auc = None  # Single class in test set

    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    # ─── Feature importance ──────────────────────
    importances = model.feature_importances_
    feature_importance = sorted(
        [{"feature": name, "importance": round(float(imp), 4)}
         for name, imp in zip(feature_cols, importances)],
        key=lambda x: x["importance"], reverse=True
    )

    # ─── Save artifacts ──────────────────────────
    joblib.dump(model, os.path.join(model_dir, "model.joblib"))
    joblib.dump(scaler, os.path.join(model_dir, "scaler.joblib"))

    if label_encoders:
        joblib.dump(label_encoders, os.path.join(model_dir, "encoders.joblib"))

    # Save metadata
    metadata = {
        "org_id": org_id,
        "feature_cols": feature_cols,
        "target_col": target_col,
        "target_mapping": target_mapping,
        "feature_metadata": feature_metadata,
        "dataset_rows": len(X),
        "dataset_cols": len(feature_cols),
        "accuracy": accuracy,
        "auc": auc,
        "churn_rate": round(float(churn_rate), 4),
        "feature_importance": feature_importance,
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "training_time_sec": round(time.time() - start_time, 2),
    }

    with open(os.path.join(model_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Custom model trained for org {org_id}: accuracy={accuracy}, auc={auc}")

    return {
        "status": "success",
        "accuracy": accuracy,
        "auc": auc,
        "total_rows": len(X),
        "features_used": len(feature_cols),
        "churn_rate": round(float(churn_rate) * 100, 1),
        "feature_importance": feature_importance,
        "feature_metadata": feature_metadata,
        "training_time_sec": metadata["training_time_sec"],
        "warnings": warnings,
        "classification_report": {
            k: v for k, v in report.items()
            if k in ("0", "1", "accuracy", "macro avg", "weighted avg")
        },
    }


def load_custom_model(org_id):
    """Load a previously trained custom model and its metadata."""
    model_dir = get_model_dir(org_id)
    meta_path = os.path.join(model_dir, "metadata.json")

    if not os.path.exists(meta_path):
        return None, None, None, None, None

    with open(meta_path, "r") as f:
        metadata = json.load(f)

    model = joblib.load(os.path.join(model_dir, "model.joblib"))
    scaler_obj = joblib.load(os.path.join(model_dir, "scaler.joblib"))

    encoders_path = os.path.join(model_dir, "encoders.joblib")
    encoders = joblib.load(encoders_path) if os.path.exists(encoders_path) else {}

    return model, scaler_obj, metadata, encoders


def predict_with_custom_model(features, org_id):
    """
    Make a prediction using the org's custom model.

    Args:
        features: dict of feature_name -> value
        org_id: organization identifier

    Returns:
        (label, probability, risk_level, explanation)
    """
    result = load_custom_model(org_id)
    if result is None or result[0] is None:
        raise ValueError(f"No custom model found for organization '{org_id}'")

    custom_model, custom_scaler, metadata, encoders = result
    feature_cols = metadata["feature_cols"]
    target_mapping = metadata.get("target_mapping")

    # Build feature vector
    row = []
    for col in feature_cols:
        val = features.get(col, 0)
        if col in encoders:
            le = encoders[col]
            try:
                val = le.transform([str(val)])[0]
            except ValueError:
                # Unknown category — use 0
                val = 0
        else:
            try:
                val = float(val)
            except (ValueError, TypeError):
                val = 0
        row.append(val)

    arr = np.array(row, dtype=float).reshape(1, -1)
    arr_scaled = custom_scaler.transform(arr)

    proba = custom_model.predict_proba(arr_scaled)[0]
    churn_prob = float(proba[1])
    label = "Churn" if churn_prob >= 0.5 else "Stay"

    # Risk classification
    if churn_prob >= 0.75:
        risk = "Critical"
    elif churn_prob >= 0.5:
        risk = "High"
    elif churn_prob >= 0.3:
        risk = "Medium"
    else:
        risk = "Low"

    # SHAP explanation for custom model
    explanation = None
    try:
        import shap
        explainer = shap.TreeExplainer(custom_model)
        shap_values = explainer.shap_values(arr_scaled)

        if isinstance(shap_values, list):
            sv = np.array(shap_values[1]).flatten()
        elif isinstance(shap_values, np.ndarray):
            if shap_values.ndim == 3:
                sv = shap_values[0, :, 1]
            elif shap_values.ndim == 2:
                sv = shap_values[0]
            else:
                sv = shap_values.flatten()
        else:
            sv = np.array(shap_values).flatten()

        explanation = []
        for idx, name in enumerate(feature_cols):
            impact = float(sv[idx])
            explanation.append({
                "feature": name,
                "impact": round(impact, 4),
                "direction": "increases churn" if impact > 0 else "decreases churn",
                "value": features.get(name),
            })
        explanation.sort(key=lambda x: abs(x["impact"]), reverse=True)
    except Exception as e:
        logger.warning(f"SHAP for custom model failed: {e}")

    return label, round(churn_prob, 4), risk, explanation


def list_custom_models():
    """List all trained custom models."""
    if not os.path.exists(CUSTOM_MODELS_DIR):
        return []

    models = []
    for org_id in os.listdir(CUSTOM_MODELS_DIR):
        meta_path = os.path.join(CUSTOM_MODELS_DIR, org_id, "metadata.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                meta = json.load(f)
            models.append({
                "org_id": org_id,
                "features": meta.get("feature_cols", []),
                "accuracy": meta.get("accuracy"),
                "trained_at": meta.get("trained_at"),
                "dataset_rows": meta.get("dataset_rows"),
            })
    return models


def delete_custom_model(org_id):
    """Delete a custom model for an organization."""
    import shutil
    model_dir = os.path.join(CUSTOM_MODELS_DIR, str(org_id))
    if os.path.exists(model_dir):
        shutil.rmtree(model_dir)
        return True
    return False
