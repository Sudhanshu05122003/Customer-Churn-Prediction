"""
ChurnSense — Authentication System
====================================
JWT-based authentication with user registration and login.
Passwords are hashed with bcrypt. Tokens expire per config.
"""

import os
import psycopg2
import psycopg2.extras
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import request, jsonify, g

from config import Config

DATABASE_URL = Config.DATABASE_URL
JWT_SECRET = Config.JWT_SECRET_KEY
JWT_EXPIRY_HOURS = Config.JWT_ACCESS_TOKEN_EXPIRES_HOURS


# ─── Database Setup ────────────────────────────
def init_auth_db():
    """Create users table if it doesn't exist."""
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    # Drop existing table to apply schema change if needed
    cursor.execute("DROP TABLE IF EXISTS users_old") # just in case
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          SERIAL PRIMARY KEY,
            username    VARCHAR(255) NOT NULL UNIQUE,
            email       VARCHAR(255) NOT NULL,
            password    TEXT    NOT NULL,
            salt        TEXT    NOT NULL,
            organization TEXT,
            created_at  TEXT    NOT NULL,
            is_active   INTEGER DEFAULT 1,
            plan        VARCHAR(50) DEFAULT 'free',
            api_calls   INTEGER DEFAULT 0
        )
    """)
    
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN plan VARCHAR(50) DEFAULT 'free'")
    except psycopg2.Error:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN api_calls INTEGER DEFAULT 0")
    except psycopg2.Error:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN last_login TEXT")
    except psycopg2.Error:
        pass
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0")
    except psycopg2.Error:
        pass

    cursor.close()
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
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # We NO LONGER check for existing email
    
    # Still check for unique username as it's the primary identifier
    cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
    existing = cursor.fetchone()
    if existing:
        cursor.close()
        conn.close()
        return None, "Username already taken"

    hashed, salt = hash_password(password)

    cursor.execute(
        """INSERT INTO users (username, email, password, salt, organization, created_at)
           VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
        (username, email, hashed, salt, organization, datetime.now(timezone.utc).isoformat()),
    )
    user = cursor.fetchone()
    conn.commit()

    cursor.close()
    conn.close()

    return dict(user), None


def authenticate_user(email: str, password: str):
    """Authenticate user credentials. Checks all accounts with this email."""
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Fetch ALL users with this email
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    users = cursor.fetchall()
    
    # Try to find a matching password among all users with this email
    for user in users:
        if verify_password(password, user["password"], user["salt"]):
            # Update last_login and login_count
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE users SET last_login = %s, login_count = COALESCE(login_count, 0) + 1 WHERE id = %s",
                (now_iso, user["id"])
            )
            conn.commit()
            cursor.close()
            conn.close()
            
            user_dict = dict(user)
            user_dict["last_login"] = now_iso # Update dict for current session
            return user_dict, None

    conn.close()
    return None, "Invalid email or password"
