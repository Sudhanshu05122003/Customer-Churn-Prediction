"""
ChurnSense — WSGI Entry Point
================================
Use this file with Gunicorn for production deployments:
  gunicorn wsgi:app -c gunicorn.conf.py
"""

from app import app

if __name__ == "__main__":
    app.run()
