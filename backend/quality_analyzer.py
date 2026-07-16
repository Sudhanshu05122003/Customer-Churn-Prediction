import pandas as pd
import numpy as np

def analyze_dataset_quality(df):
    """
    Perform statistical profiling and quality check of an uploaded dataset.
    """
    total_rows = len(df)
    if total_rows == 0:
        return {"score": 0, "error": "Empty dataset"}

    # 1. Missing Values
    missing_report = {}
    total_missing = 0
    for col in df.columns:
        null_count = int(df[col].isnull().sum())
        null_pct = round((null_count / total_rows) * 100, 1)
        missing_report[col] = {
            "count": null_count,
            "pct": null_pct
        }
        total_missing += null_count

    # 2. Duplicate Detection
    duplicate_count = int(df.duplicated().sum())

    # 3. Outlier Detection (using simple IQR on numeric columns)
    outliers_report = {}
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in numeric_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
        outliers_report[col] = {
            "count": int(len(outliers)),
            "pct": round((len(outliers) / total_rows) * 100, 1)
        }

    # 4. Correlation Matrix
    corr_matrix = {}
    if len(numeric_cols) > 1:
        corr = df[numeric_cols].corr().fillna(0).round(2).to_dict()
        corr_matrix = corr

    # 5. Class Balance
    # Try to find a target column like "Exited", "Churn", "target"
    target_col = None
    for col in df.columns:
        if str(col).lower() in ["exited", "churn", "target", "label"]:
            target_col = col
            break

    class_balance = {}
    imbalance_warning = False
    if target_col is not None:
        counts = df[target_col].value_counts().to_dict()
        for k, v in counts.items():
            class_balance[str(k)] = {
                "count": int(v),
                "pct": round((v / total_rows) * 100, 1)
            }
        # If churn rate is very low (<10% or >90%), warn
        min_pct = min([c["pct"] for c in class_balance.values()]) if class_balance else 50
        if min_pct < 10.0:
            imbalance_warning = True

    # 6. Quality Score
    # Start at 100, deduct points for issues:
    # Missing values: -2 per 1% total missing (max -20)
    # Duplicates: -1 per 5 duplicates (max -10)
    # Imbalance: -10 if warning
    missing_penalty = min(20, int((total_missing / (total_rows * len(df.columns) or 1)) * 200))
    duplicate_penalty = min(10, int(duplicate_count / 5))
    imbalance_penalty = 10 if imbalance_warning else 0
    score = max(50, 100 - missing_penalty - duplicate_penalty - imbalance_penalty)

    # 7. Suggested Fixes
    suggested_fixes = []
    for col, data in missing_report.items():
        if data["pct"] > 0:
            suggested_fixes.append(f"Impute missing values in {col} ({data['pct']}% missing)")
    if duplicate_count > 0:
        suggested_fixes.append(f"Remove {duplicate_count} duplicate records")
    if imbalance_warning:
        suggested_fixes.append("Apply balanced class weights during model training")

    return {
        "score": score,
        "total_rows": total_rows,
        "total_columns": len(df.columns),
        "missing_report": missing_report,
        "duplicate_count": duplicate_count,
        "outliers_report": outliers_report,
        "correlation_matrix": corr_matrix,
        "class_balance": class_balance,
        "imbalance_warning": imbalance_warning,
        "suggested_fixes": suggested_fixes
    }
