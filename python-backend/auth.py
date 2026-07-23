"""
JWT Authentication & Password Hashing — SheShield Backend
Equivalent to the auth middleware in the Node.js server.js
"""
import os
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext
from fastapi import Request, HTTPException

# Password hashing context — bcrypt with 12 rounds (passlib default, compatible with Node bcryptjs)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_token(user_id: str) -> str:
    """Create a JWT token with 7-day expiry. Matches the Node.js jwt.sign({ id }, secret, { expiresIn: '7d' })."""
    payload = {
        "id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(request: Request) -> str:
    """
    FastAPI dependency — extracts and verifies the Bearer token from the Authorization header.
    Returns the user_id string.
    Equivalent to the authMiddleware in server.js.
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={"success": False, "message": "Unauthorized - No token provided"},
        )

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail={"success": False, "message": "Unauthorized - Token expired"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail={"success": False, "message": "Unauthorized - Invalid token"},
        )
