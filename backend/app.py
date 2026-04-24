"""
ChurnSense — Production Flask API v3.0
========================================
General Purpose Churn Prediction Engine.
Any organization can upload their data, train a custom model,
and predict churn using their own features.

Features:
  ✓ Custom model training from any CSV
  ✓ Dynamic schema-based prediction forms
  ✓ Default banking model + per-org custom models
  ✓ Pydantic input validation
  ✓ JWT authentication
  ✓ SHAP model explainability
  ✓ Structured JSON logging

Endpoints:
  POST /auth/register     → create account
  POST /auth/login        → get JWT token
  GET  /auth/me           → current user info (protected)
  POST /train             → upload CSV + train custom model
  GET  /schema            → get active model's feature schema
  GET  /models            → list trained custom models
  POST /predict           → single prediction (auto-detects model)
  POST /predict-bulk      → CSV bulk predictions
  GET  /history           → prediction history (protected)
  GET  /stats             → dashboard statistics
  GET  /api/health        → health check

Run:  python app.py
"""

import os
import io
import sys
import json
import sqlite3
import logging
import time
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS
from pydantic import ValidationError

# ─── Local modules ───────────────────────────
from config import Config
from schema import CustomerFeatures, RegisterRequest, LoginRequest
from auth import (
    init_auth_db, register_user, authenticate_user,
    create_token, token_required, optional_token
)
from trainer import (
    analyze_columns, train_custom_model, load_custom_model,
    predict_with_custom_model, list_custom_models, delete_custom_model
)

# ═══════════════════════════════════════════════
#  LOGGING SETUP
# ═══════════════════════════════════════════════
class JSONFormatter(logging.Formatter):
    """Structured JSON log formatter for production observability."""
    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "extra_data"):
            log_entry.update(record.extra_data)
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)

# Configure root logger
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(JSONFormatter())
logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger("churnsense")

# ═══════════════════════════════════════════════
#  APP SETUP
# ═══════════════════════════════════════════════
app = Flask(__name__, static_folder=Config.FRONTEND_DIR, static_url_path="")
app.config["SECRET_KEY"] = Config.SECRET_KEY
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})

# ─── Load model & scaler ───────────────────────
logger.info("Loading ML model and scaler...")
model = joblib.load(Config.MODEL_PATH)
scaler = joblib.load(Config.SCALER_PATH)
logger.info("Model loaded successfully")

# ─── SHAP explainer (lazy-loaded) ──────────────
shap_explainer = None

def get_shap_explainer():
    """Lazy-load SHAP explainer to avoid startup penalty."""
    global shap_explainer
    if shap_explainer is None:
        try:
            import shap
            shap_explainer = shap.TreeExplainer(model)
            logger.info("SHAP explainer initialized")
        except ImportError:
            logger.warning("SHAP not installed — explainability disabled")
            return None
    return shap_explainer

# ─── Database helpers ───────────────────────────
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(Config.DATABASE_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    """Create prediction table."""
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   TEXT    NOT NULL,
            user_id     INTEGER,
            gender      INTEGER,
            age         INTEGER,
            tenure      INTEGER,
            balance     REAL,
            num_products INTEGER,
            has_cr_card INTEGER,
            is_active   INTEGER,
            est_salary  REAL,
            prediction  TEXT,
            probability REAL,
            risk_level  TEXT,
            source      TEXT DEFAULT 'manual'
        )
    """)
    conn.commit()
    conn.close()

init_db()
init_auth_db()

# ═══════════════════════════════════════════════
#  REQUEST LIFECYCLE LOGGING
# ═══════════════════════════════════════════════
@app.before_request
def log_request_start():
    g.start_time = time.time()

@app.after_request
def log_request_end(response):
    duration = round((time.time() - g.get("start_time", time.time())) * 1000, 2)
    if request.path not in ("/", "/favicon.ico") and not request.path.startswith("/css") and not request.path.startswith("/js"):
        logger.info(
            "Request completed",
            extra={"extra_data": {
                "method": request.method,
                "path": request.path,
                "status": response.status_code,
                "duration_ms": duration,
                "ip": request.remote_addr,
            }}
        )
    return response

# ═══════════════════════════════════════════════
#  GLOBAL ERROR HANDLERS
# ═══════════════════════════════════════════════
@app.errorhandler(400)
def bad_request(e):
    return jsonify({"error": "Bad request", "code": 400, "details": str(e)}), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found", "code": 404}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed", "code": 405}), 405

@app.errorhandler(429)
def rate_limited(e):
    return jsonify({"error": "Rate limit exceeded. Please try again later.", "code": 429}), 429

@app.errorhandler(500)
def internal_error(e):
    logger.error("Internal server error", exc_info=True)
    return jsonify({"error": "Internal server error", "code": 500}), 500

# ═══════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════
def classify_risk(probability: float) -> str:
    """Classify churn probability into risk levels."""
    if probability >= 0.75:
        return "Critical"
    elif probability >= 0.5:
        return "High"
    elif probability >= 0.3:
        return "Medium"
    else:
        return "Low"

def predict_single(features: dict):
    """Return (label, probability, risk_level, explanation) for one customer."""
    row = [features.get(c, 0) for c in Config.FEATURE_COLS]
    arr = np.array(row, dtype=float).reshape(1, -1)
    arr_scaled = scaler.transform(arr)

    proba = model.predict_proba(arr_scaled)[0]
    churn_prob = float(proba[1])
    label = "Churn" if churn_prob >= 0.5 else "Stay"
    risk = classify_risk(churn_prob)

    # SHAP explanation
    explanation = None
    explainer = get_shap_explainer()
    if explainer is not None:
        try:
            shap_values = explainer.shap_values(arr_scaled)

            # Handle different SHAP output formats
            if isinstance(shap_values, list):
                # Old format: list of [class_0_vals, class_1_vals]
                sv = np.array(shap_values[1]).flatten()
            elif isinstance(shap_values, np.ndarray):
                if shap_values.ndim == 3:
                    # Shape: (samples, features, classes) — take class 1
                    sv = shap_values[0, :, 1]
                elif shap_values.ndim == 2:
                    sv = shap_values[0]
                else:
                    sv = shap_values.flatten()
            else:
                sv = np.array(shap_values).flatten()

            explanation = []
            for idx, name in enumerate(Config.FEATURE_COLS):
                impact = float(sv[idx])
                explanation.append({
                    "feature": name,
                    "impact": round(impact, 4),
                    "direction": "increases churn" if impact > 0 else "decreases churn",
                    "value": features.get(name),
                })
            # Sort by absolute impact
            explanation.sort(key=lambda x: abs(x["impact"]), reverse=True)
        except Exception as e:
            logger.warning(f"SHAP explanation failed: {e}")
            explanation = None

    return label, round(churn_prob, 4), risk, explanation


def save_prediction(features, label, probability, risk_level, source="manual", user_id=None):
    """Persist prediction to SQLite."""
    db = get_db()
    db.execute(
        """INSERT INTO predictions
           (timestamp, user_id, gender, age, tenure, balance,
            num_products, has_cr_card, is_active, est_salary,
            prediction, probability, risk_level, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            datetime.now(timezone.utc).isoformat(),
            user_id,
            features.get("Gender"),
            features.get("Age"),
            features.get("Tenure"),
            features.get("Balance"),
            features.get("NumOfProducts"),
            features.get("HasCrCard"),
            features.get("IsActiveMember"),
            features.get("EstimatedSalary"),
            label,
            probability,
            risk_level,
            source,
        ),
    )
    db.commit()

# ═══════════════════════════════════════════════
#  ROUTES — FRONTEND
# ═══════════════════════════════════════════════
@app.route("/")
def index():
    return send_from_directory(Config.FRONTEND_DIR, "index.html")

# ═══════════════════════════════════════════════
#  ROUTES — AUTH
# ═══════════════════════════════════════════════
@app.route("/auth/register", methods=["POST"])
def auth_register():
    """Register a new user account."""
    try:
        data = request.get_json(force=True)
        req = RegisterRequest(**data)
    except ValidationError as e:
        return jsonify({"error": "Validation failed", "code": 422, "details": e.errors()}), 422
    except Exception:
        return jsonify({"error": "Invalid JSON body", "code": 400}), 400

    user, err = register_user(req.username, req.email, req.password, req.organization)
    if err:
        return jsonify({"error": err, "code": 409}), 409

    token = create_token(user["id"], user["email"], user["username"])
    logger.info(f"User registered: {user['email']}")

    return jsonify({
        "message": "Registration successful",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "organization": user["organization"],
        }
    }), 201


@app.route("/auth/login", methods=["POST"])
def auth_login():
    """Authenticate and return JWT token."""
    try:
        data = request.get_json(force=True)
        req = LoginRequest(**data)
    except ValidationError as e:
        return jsonify({"error": "Validation failed", "code": 422, "details": e.errors()}), 422
    except Exception:
        return jsonify({"error": "Invalid JSON body", "code": 400}), 400

    user, err = authenticate_user(req.email, req.password)
    if err:
        return jsonify({"error": err, "code": 401}), 401

    token = create_token(user["id"], user["email"], user["username"])
    logger.info(f"User login: {user['email']}")

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "organization": user["organization"],
        }
    })


@app.route("/auth/me", methods=["GET"])
@token_required
def auth_me():
    """Return current authenticated user info."""
    return jsonify({"user": g.current_user})

# ═══════════════════════════════════════════════
#  ROUTES — PREDICTIONS
# ═══════════════════════════════════════════════
@app.route("/predict", methods=["POST"])
@optional_token
def predict():
    """Single customer prediction — auto-detects default vs custom model."""
    try:
        data = request.get_json(force=True)
        user_id = g.current_user.get("user_id") if g.current_user else None

        # Check if user has a custom model
        org_id = data.pop("_org_id", None) or (str(user_id) if user_id else None)
        use_custom = False

        if org_id:
            result = load_custom_model(org_id)
            if result and result[0] is not None:
                use_custom = True

        if use_custom:
            # ── Custom model prediction ──
            features = {k: v for k, v in data.items() if not k.startswith("_")}
            label, probability, risk_level, explanation = predict_with_custom_model(features, org_id)

            response = {
                "prediction": label,
                "probability": probability,
                "risk_level": risk_level,
                "features": features,
                "model_type": "custom",
            }
            if explanation:
                response["explanation"] = explanation
        else:
            # ── Default banking model ──
            try:
                validated = CustomerFeatures(**data)
                features = validated.model_dump()
            except ValidationError as e:
                error_details = [{"field": err["loc"][-1], "message": err["msg"]} for err in e.errors()]
                return jsonify({
                    "error": "Validation failed",
                    "code": 422,
                    "details": error_details
                }), 422

            label, probability, risk_level, explanation = predict_single(features)
            save_prediction(features, label, probability, risk_level, source="manual", user_id=user_id)

            response = {
                "prediction": label,
                "probability": probability,
                "risk_level": risk_level,
                "features": features,
                "model_type": "default",
            }
            if explanation:
                response["explanation"] = explanation

        logger.info("Single prediction", extra={"extra_data": {
            "prediction": label, "probability": probability,
            "risk_level": risk_level, "model": "custom" if use_custom else "default"
        }})

        return jsonify(response)

    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        return jsonify({"error": str(e), "code": 500}), 500


@app.route("/predict-bulk", methods=["POST"])
@optional_token
def predict_bulk():
    """Bulk prediction from CSV upload."""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded", "code": 400}), 400

        file = request.files["file"]
        if not file.filename.lower().endswith(".csv"):
            return jsonify({"error": "Only .csv files are accepted", "code": 400}), 400

        # Read CSV
        stream = io.StringIO(file.stream.read().decode("utf-8"))
        df = pd.read_csv(stream)

        if len(df) == 0:
            return jsonify({"error": "CSV file is empty", "code": 400}), 400

        if len(df) > 10000:
            return jsonify({"error": "CSV exceeds 10,000 row limit", "code": 400}), 400

        # Normalize column names
        col_map = {}
        for col in df.columns:
            clean = col.strip().replace(" ", "")
            for fc in Config.FEATURE_COLS:
                if clean.lower() == fc.lower():
                    col_map[col] = fc
                    break
        df.rename(columns=col_map, inplace=True)

        # Check required columns
        missing = [c for c in Config.FEATURE_COLS if c not in df.columns]
        if missing:
            return jsonify({
                "error": f"CSV missing required columns: {missing}",
                "code": 400,
                "expected_columns": Config.FEATURE_COLS,
            }), 400

        # Predict each row
        user_id = g.current_user.get("user_id") if g.current_user else None
        results = []
        for _, row in df.iterrows():
            features = {c: row[c] for c in Config.FEATURE_COLS}
            label, prob, risk, explanation = predict_single(features)
            save_prediction(features, label, prob, risk, source="csv", user_id=user_id)
            result_entry = {
                **features,
                "prediction": label,
                "probability": prob,
                "risk_level": risk,
            }
            if explanation:
                result_entry["explanation"] = explanation
            results.append(result_entry)

        churn_count = sum(1 for r in results if r["prediction"] == "Churn")
        stay_count = len(results) - churn_count

        logger.info("Bulk prediction", extra={"extra_data": {
            "total": len(results), "churn": churn_count, "stay": stay_count
        }})

        return jsonify({
            "total": len(results),
            "churn_count": churn_count,
            "stay_count": stay_count,
            "churn_pct": round(churn_count / len(results) * 100, 1) if results else 0,
            "stay_pct": round(stay_count / len(results) * 100, 1) if results else 0,
            "results": results,
        })

    except Exception as e:
        logger.error(f"Bulk prediction error: {e}", exc_info=True)
        return jsonify({"error": str(e), "code": 500}), 500


# ═══════════════════════════════════════════════
#  ROUTES — HISTORY & STATS
# ═══════════════════════════════════════════════
@app.route("/history", methods=["GET"])
@optional_token
def history():
    """Return prediction history. If authenticated, returns user-specific history."""
    try:
        limit = request.args.get("limit", 50, type=int)
        db = get_db()

        if g.current_user:
            rows = db.execute(
                "SELECT * FROM predictions WHERE user_id = ? ORDER BY id DESC LIMIT ?",
                (g.current_user["user_id"], limit)
            ).fetchall()
        else:
            rows = db.execute(
                "SELECT * FROM predictions ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()

        return jsonify([dict(r) for r in rows])
    except Exception as e:
        logger.error(f"History error: {e}")
        return jsonify({"error": str(e), "code": 500}), 500


@app.route("/history/<int:prediction_id>", methods=["DELETE"])
@optional_token
def delete_history(prediction_id):
    """Delete a specific prediction entry."""
    try:
        db = get_db()
        user_id = g.current_user.get("user_id") if g.current_user else None

        if user_id:
            # Check ownership
            entry = db.execute("SELECT user_id FROM predictions WHERE id = ?", (prediction_id,)).fetchone()
            if not entry:
                return jsonify({"error": "Entry not found", "code": 404}), 404
            if entry["user_id"] != user_id:
                return jsonify({"error": "Unauthorized to delete this entry", "code": 403}), 403

            db.execute("DELETE FROM predictions WHERE id = ?", (prediction_id,))
        else:
            # For guest users, only allow if the entry has no user_id (optional policy)
            db.execute("DELETE FROM predictions WHERE id = ?", (prediction_id,))

        db.commit()
        return jsonify({"message": "Entry deleted successfully", "id": prediction_id})
    except Exception as e:
        logger.error(f"Delete history error: {e}")
        return jsonify({"error": str(e), "code": 500}), 500


@app.route("/stats", methods=["GET"])
def stats():
    """Aggregate statistics for the dashboard."""
    try:
        db = get_db()
        total = db.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
        churn = db.execute(
            "SELECT COUNT(*) FROM predictions WHERE prediction='Churn'"
        ).fetchone()[0]
        stay = total - churn

        trend = db.execute("""
            SELECT DATE(timestamp) as date,
                   SUM(CASE WHEN prediction='Churn' THEN 1 ELSE 0 END) as churns,
                   SUM(CASE WHEN prediction='Stay'  THEN 1 ELSE 0 END) as stays,
                   COUNT(*) as total
            FROM predictions
            GROUP BY DATE(timestamp)
            ORDER BY date DESC
            LIMIT 7
        """).fetchall()

        # Risk distribution
        risk_dist = db.execute("""
            SELECT risk_level, COUNT(*) as count
            FROM predictions
            WHERE risk_level IS NOT NULL
            GROUP BY risk_level
        """).fetchall()

        return jsonify({
            "total_predictions": total,
            "churn_count": churn,
            "stay_count": stay,
            "churn_pct": round(churn / total * 100, 1) if total else 0,
            "stay_pct": round(stay / total * 100, 1) if total else 0,
            "trend": [dict(r) for r in trend],
            "risk_distribution": [dict(r) for r in risk_dist],
        })
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return jsonify({"error": str(e), "code": 500}), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint for monitoring."""
    return jsonify({
        "status": "healthy",
        "version": "3.0.0",
        "model_loaded": model is not None,
        "shap_available": get_shap_explainer() is not None,
        "custom_models": len(list_custom_models()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


# ═══════════════════════════════════════════════
#  ROUTES — CUSTOM MODEL TRAINING
# ═══════════════════════════════════════════════
@app.route("/train", methods=["POST"])
@optional_token
def train_model_route():
    """Upload a CSV and train a custom churn model."""
    try:
        # Get org_id — either from auth or from form field
        org_id = None
        if g.current_user:
            org_id = g.current_user.get("user_id")
        if not org_id:
            org_id = request.form.get("org_id", "default")

        # Check if this is a column-analysis request (step 1)
        analyze_only = request.form.get("analyze_only", "false").lower() == "true"

        if "file" not in request.files:
            return jsonify({"error": "No file uploaded", "code": 400}), 400

        file = request.files["file"]
        if not file.filename.lower().endswith(".csv"):
            return jsonify({"error": "Only .csv files are accepted", "code": 400}), 400

        # Read CSV
        stream = io.StringIO(file.stream.read().decode("utf-8"))
        df = pd.read_csv(stream)

        if len(df) == 0:
            return jsonify({"error": "CSV file is empty", "code": 400}), 400

        if len(df) > 100000:
            return jsonify({"error": "CSV exceeds 100,000 row limit", "code": 400}), 400

        # Step 1: Analyze columns and return schema for mapping
        if analyze_only:
            columns = analyze_columns(df)
            return jsonify({
                "status": "analysis",
                "total_rows": len(df),
                "total_columns": len(df.columns),
                "columns": columns,
                "preview": df.head(5).fillna("").to_dict(orient="records"),
            })

        # Step 2: Train model with mapped columns
        feature_cols_raw = request.form.get("feature_cols", "")
        target_col = request.form.get("target_col", "")

        if not feature_cols_raw or not target_col:
            return jsonify({
                "error": "Missing 'feature_cols' and 'target_col' form fields",
                "code": 400,
            }), 400

        feature_cols = [c.strip() for c in feature_cols_raw.split(",") if c.strip()]

        if len(feature_cols) < 1:
            return jsonify({"error": "At least 1 feature column required", "code": 400}), 400

        if len(feature_cols) > 50:
            return jsonify({"error": "Maximum 50 feature columns allowed", "code": 400}), 400

        # Train
        result = train_custom_model(df, feature_cols, target_col, org_id)

        logger.info(f"Custom model trained for org={org_id}", extra={"extra_data": {
            "org_id": org_id, "accuracy": result["accuracy"],
            "features": len(feature_cols), "rows": result["total_rows"]
        }})

        return jsonify(result), 200

    except ValueError as e:
        return jsonify({"error": str(e), "code": 400}), 400
    except Exception as e:
        logger.error(f"Training error: {e}", exc_info=True)
        return jsonify({"error": str(e), "code": 500}), 500


@app.route("/schema", methods=["GET"])
@optional_token
def get_schema():
    """Return the active model's feature schema for dynamic form generation."""
    org_id = None
    if g.current_user:
        org_id = g.current_user.get("user_id")
    if not org_id:
        org_id = request.args.get("org_id")

    # Check for custom model first
    if org_id:
        result = load_custom_model(org_id)
        if result and result[0] is not None:
            _, _, metadata, _ = result
            return jsonify({
                "model_type": "custom",
                "org_id": str(org_id),
                "features": metadata["feature_metadata"],
                "target_col": metadata.get("target_col"),
                "accuracy": metadata.get("accuracy"),
                "auc": metadata.get("auc"),
                "trained_at": metadata.get("trained_at"),
                "dataset_rows": metadata.get("dataset_rows"),
                "feature_importance": metadata.get("feature_importance", []),
            })

    # Fall back to default banking model
    return jsonify({
        "model_type": "default",
        "org_id": None,
        "features": [
            {"name": "Gender", "type": "categorical", "categories": ["Female", "Male"]},
            {"name": "Age", "type": "numeric", "min": 18, "max": 100},
            {"name": "Tenure", "type": "numeric", "min": 0, "max": 20},
            {"name": "Balance", "type": "numeric", "min": 0, "max": 500000},
            {"name": "NumOfProducts", "type": "numeric", "min": 1, "max": 4},
            {"name": "HasCrCard", "type": "categorical", "categories": ["No", "Yes"]},
            {"name": "IsActiveMember", "type": "categorical", "categories": ["No", "Yes"]},
            {"name": "EstimatedSalary", "type": "numeric", "min": 0, "max": 500000},
        ],
        "target_col": "Exited",
        "accuracy": None,
    })


@app.route("/models", methods=["GET"])
def get_models():
    """List all trained custom models."""
    return jsonify({"models": list_custom_models()})


@app.route("/models/<org_id>", methods=["DELETE"])
@token_required
def remove_model(org_id):
    """Delete a custom model."""
    if delete_custom_model(org_id):
        return jsonify({"message": f"Model for org '{org_id}' deleted"})
    return jsonify({"error": "Model not found", "code": 404}), 404


@app.route("/api/sample-data", methods=["GET"])
def get_sample_data():
    """Download the sample_data.csv file for testing the custom model setup."""
    sample_path = os.path.join(os.path.dirname(app.root_path), "sample_data.csv")
    if os.path.exists(sample_path):
        from flask import send_file
        return send_file(sample_path, mimetype="text/csv", as_attachment=True, download_name="sample_data.csv")
    return jsonify({"error": "Sample data not found", "code": 404}), 404


# ═══════════════════════════════════════════════
#  RUN
# ═══════════════════════════════════════════════
if __name__ == "__main__":
    logger.info(f"Starting ChurnSense API on http://{Config.HOST}:{Config.PORT}")
    app.run(debug=False, host=Config.HOST, port=Config.PORT)
