import json
import os
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRACKER_FILE = os.path.join(BASE_DIR, "custom_models", "experiments.json")

def log_experiment(org_id, algorithm, params, metrics):
    """
    Log an AutoML training experiment run (similar to a simplified MLflow).
    """
    try:
        os.makedirs(os.path.dirname(TRACKER_FILE), exist_ok=True)
        
        runs = []
        if os.path.exists(TRACKER_FILE):
            try:
                with open(TRACKER_FILE, "r") as f:
                    runs = json.load(f)
            except Exception:
                pass
                
        run_entry = {
            "run_id": f"run_{int(time.time())}",
            "org_id": org_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "algorithm": algorithm,
            "parameters": params,
            "metrics": metrics
        }
        
        runs.append(run_entry)
        
        with open(TRACKER_FILE, "w") as f:
            json.dump(runs, f, indent=2)
            
        return run_entry
    except Exception as e:
        print(f"Error logging ML experiment: {e}")
        return None

def get_experiments(org_id):
    """
    Get all logged training runs for an organization.
    """
    try:
        if not os.path.exists(TRACKER_FILE):
            return []
            
        with open(TRACKER_FILE, "r") as f:
            runs = json.load(f)
            
        return [r for r in runs if r.get("org_id") == org_id]
    except Exception:
        return []
