# Dockerfile for Python Flask Backend
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose backend port
EXPOSE 5005

# Command to run Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5005", "wsgi:app"]
