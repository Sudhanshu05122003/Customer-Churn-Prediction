# ═══════════════════════════════════════════
# ChurnSense Dockerfile
# Multi-stage build for production deployment
# ═══════════════════════════════════════════

FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# ─── Dependencies ───────────────────────
FROM base AS dependencies

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ─── Application ────────────────────────
FROM dependencies AS application

# Copy backend
COPY backend/ ./backend/

# Copy frontend
COPY frontend/ ./frontend/

# Copy project files
COPY sample_data.csv .

# Train model if not already present
RUN cd backend && python train_model.py

# ─── Production ─────────────────────────
FROM application AS production

EXPOSE 5000

WORKDIR /app/backend

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/health')" || exit 1

# Run with Gunicorn
CMD ["gunicorn", "wsgi:app", "-c", "gunicorn.conf.py"]
