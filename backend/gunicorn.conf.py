# ───────────────────────────────────────
# Gunicorn Configuration — ChurnSense
# ───────────────────────────────────────

import multiprocessing

# Server socket
bind = "0.0.0.0:5000"

# Workers — (2 x CPU cores) + 1 is recommended
workers = multiprocessing.cpu_count() * 2 + 1

# Worker class
worker_class = "sync"

# Timeout (seconds) — increase for large CSV uploads
timeout = 120

# Max requests before worker recycle (prevents memory leaks)
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "-"  # stdout
errorlog = "-"   # stderr
loglevel = "info"

# Preload app for faster worker startup & shared model memory
preload_app = True
