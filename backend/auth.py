"""
ChurnSense — Authentication System
====================================
JWT-based authentication with user registration and login.
Passwords are hashed with bcrypt. Tokens expire per config.
"""

import os
import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import request, jsonify, g

from config import Config

DB_PATH = Config.DATABASE_PATH
JWT_SECRET = Config.JWT_SECRET_KEY
JWT_EXPIRY_HOURS = Config.JWT_ACCESS_TOKEN_EXPIRES_HOURS


# ─── Database Setup ────────────────────────────
def init_auth_db():
    """Create users table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT    NOT NULL UNIQUE,
            email       TEXT    NOT NULL UNIQUE,
            password    TEXT    NOT NULL,
            salt        TEXT    NOT NULL,
            organization TEXT,
            created_at  TEXT    NOT NULL,
            is_active   INTEGER DEFAULT 1
        )
    """)
    conn.commit()
    conn.close()


# ─── Password Hashing (no bcrypt dependency needed) ─────
def hash_password(password: str, salt: str = None):
    """Hash password with SHA-256 + salt."""
    if salt is None:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return hashed, salt


def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    """Verify a password against stored hash."""
    check_hash, _ = hash_password(password, salt)
    return check_hash == stored_hash


# ─── JWT Token Management ──────────────────────
def create_token(user_id: int, email: str, username: str) -> str:
    """Generate a JWT access token."""
    payload = {
        "user_id": user_id,
        "email": email,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


# ─── Auth Middleware ───────────────────────────
def token_required(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Extract token from header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({"error": "Authentication required", "code": 401}), 401

        try:
            data = decode_token(token)
            g.current_user = data
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired", "code": 401}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token", "code": 401}), 401

        return f(*args, **kwargs)
    return decorated


def optional_token(f):
    """Decorator that extracts user info if token present, but doesn't require it."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

        g.current_user = None
        if token:
            try:
                g.current_user = decode_token(token)
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                pass

        return f(*args, **kwargs)
    return decorated


# ─── User CRUD ─────────────────────────────────
def register_user(username: str, email: str, password: str, organization: str = None):
    """Register a new user. Returns (user_dict, error_string)."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Check existing
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return None, "Email already registered"

    existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if existing:
        conn.close()
        return None, "Username already taken"

    hashed, salt = hash_password(password)

    conn.execute(
        """INSERT INTO users (username, email, password, salt, organization, created_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (username, email, hashed, salt, organization, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()

    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    return dict(user), None


def authenticate_user(email: str, password: str):
    """Authenticate user credentials. Returns (user_dict, error_string)."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if not user:
        return None, "Invalid email or password"

    if not verify_password(password, user["password"], user["salt"]):
        return None, "Invalid email or password"

    return dict(user), None
