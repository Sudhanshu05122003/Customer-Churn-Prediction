FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/ /app

EXPOSE 5000

ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

CMD ["python", "app.py"]
