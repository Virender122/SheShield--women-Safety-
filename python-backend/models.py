"""
MongoDB Models / Database Helpers — SheShield Backend
Uses Motor (async MongoDB driver) instead of Mongoose.
Each function matches the Mongoose operations used in server.js.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


# ──────────────────────────────────────────────
# Helper: Convert MongoDB document for JSON response
# ──────────────────────────────────────────────

def doc_to_dict(doc: dict) -> dict:
    """
    Convert a MongoDB document to a JSON-serializable dict.
    - Converts ObjectId `_id` to string
    - Converts nested ObjectIds to string
    - Preserves datetime objects (FastAPI's jsonable_encoder handles them)
    """
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, dict):
            result[key] = doc_to_dict(value)
        elif isinstance(value, list):
            result[key] = [doc_to_dict(item) if isinstance(item, dict) else str(item) if isinstance(item, ObjectId) else item for item in value]
        else:
            result[key] = value
    return result


# ──────────────────────────────────────────────
# USER OPERATIONS
# ──────────────────────────────────────────────

async def find_user_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[dict]:
    """Find a user by email. Returns full document including password."""
    user = await db.users.find_one({"email": email})
    return doc_to_dict(user) if user else None


async def find_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> Optional[dict]:
    """Find a user by ID, excluding the password field."""
    try:
        user = await db.users.find_one(
            {"_id": ObjectId(user_id)},
            {"password": 0}
        )
        return doc_to_dict(user) if user else None
    except Exception:
        return None


async def create_user(db: AsyncIOMotorDatabase, name: str, email: str, hashed_password: str, phone: str) -> dict:
    """Create a new user. Returns the created user document."""
    user_doc = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "phone": phone,
        "emergencyEmail": "",
        "date": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    return doc_to_dict(user_doc)


# ──────────────────────────────────────────────
# SETTINGS OPERATIONS
# ──────────────────────────────────────────────

async def get_settings(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Get user settings, creating defaults if none exist (matches Mongoose upsert behavior)."""
    settings = await db.settings.find_one({"userId": ObjectId(user_id)})
    if not settings:
        settings = await create_default_settings(db, user_id)
    return doc_to_dict(settings)


async def create_default_settings(db: AsyncIOMotorDatabase, user_id: str) -> dict:
    """Create default settings for a new user."""
    settings_doc = {
        "userId": ObjectId(user_id),
        "notificationsEnabled": True,
        "locationSharing": True,
        "updatedAt": datetime.now(timezone.utc),
    }
    result = await db.settings.insert_one(settings_doc)
    settings_doc["_id"] = result.inserted_id
    return settings_doc


async def upsert_settings(db: AsyncIOMotorDatabase, user_id: str, settings_data: dict) -> dict:
    """Update user settings (upsert). Matches Settings.findOneAndUpdate in server.js."""
    # Remove fields that shouldn't be overwritten
    update_data = {k: v for k, v in settings_data.items() if k not in ("_id", "userId")}
    update_data["updatedAt"] = datetime.now(timezone.utc)

    result = await db.settings.find_one_and_update(
        {"userId": ObjectId(user_id)},
        {"$set": update_data},
        upsert=True,
        return_document=True,  # Return the updated document
    )
    return doc_to_dict(result)


# ──────────────────────────────────────────────
# GUARDIAN OPERATIONS
# ──────────────────────────────────────────────

async def get_guardians(db: AsyncIOMotorDatabase, user_id: str) -> list:
    """Get all guardians for a user, sorted by createdAt ascending."""
    cursor = db.guardians.find({"userId": ObjectId(user_id)}).sort("createdAt", 1)
    guardians = await cursor.to_list(length=100)
    return [doc_to_dict(g) for g in guardians]


async def replace_guardians(db: AsyncIOMotorDatabase, user_id: str, guardians: list) -> list:
    """Delete existing guardians and replace with new list. Matches the bulk-replace pattern in server.js."""
    await db.guardians.delete_many({"userId": ObjectId(user_id)})

    if not guardians:
        return []

    guardian_docs = [
        {
            "userId": ObjectId(user_id),
            "name": g.get("name", ""),
            "relation": g.get("relation", ""),
            "phone": g.get("phone", ""),
            "email": g.get("email", ""),
            "createdAt": datetime.now(timezone.utc),
        }
        for g in guardians
    ]
    result = await db.guardians.insert_many(guardian_docs)
    # Assign the generated IDs back
    for doc, inserted_id in zip(guardian_docs, result.inserted_ids):
        doc["_id"] = inserted_id
    return [doc_to_dict(g) for g in guardian_docs]


# ──────────────────────────────────────────────
# INCIDENT OPERATIONS
# ──────────────────────────────────────────────

async def create_incident(db: AsyncIOMotorDatabase, incident_data: dict) -> dict:
    """Create a new incident report."""
    incident_doc = {
        "userId": ObjectId(incident_data.get("userId")) if incident_data.get("userId") else None,
        "title": incident_data.get("title", ""),
        "description": incident_data.get("description", ""),
        "location": incident_data.get("location", ""),
        "type": incident_data.get("type", "Other"),
        "severity": incident_data.get("severity", "Medium"),
        "status": incident_data.get("status", "Reported"),
        "lat": incident_data.get("lat", ""),
        "lon": incident_data.get("lon", ""),
        "mediaUrl": incident_data.get("mediaUrl", ""),
        "createdAt": datetime.now(timezone.utc),
    }
    result = await db.incidents.insert_one(incident_doc)
    incident_doc["_id"] = result.inserted_id
    return doc_to_dict(incident_doc)


async def get_user_incidents(db: AsyncIOMotorDatabase, user_id: str) -> list:
    """Get all incidents reported by a specific user, newest first."""
    cursor = db.incidents.find({"userId": ObjectId(user_id)}).sort("createdAt", -1)
    incidents = await cursor.to_list(length=500)
    return [doc_to_dict(i) for i in incidents]


async def get_recent_incidents(db: AsyncIOMotorDatabase) -> list:
    """Get recent incidents (last 30 days) with valid coordinates. Matches /api/incidents/all logic."""
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    cursor = db.incidents.find({
        "createdAt": {"$gte": thirty_days_ago},
        "lat": {"$ne": ""},
        "lon": {"$ne": ""},
    }).sort("createdAt", -1).limit(100)
    incidents = await cursor.to_list(length=100)
    return [doc_to_dict(i) for i in incidents]


# ──────────────────────────────────────────────
# POST / COMMUNITY OPERATIONS
# ──────────────────────────────────────────────

async def get_recent_posts(db: AsyncIOMotorDatabase) -> list:
    """Get recent community posts (last 100), returned oldest-first for chat display."""
    cursor = db.posts.find().sort("timestamp", -1).limit(100)
    posts = await cursor.to_list(length=100)
    posts.reverse()  # Return oldest first for chat display (matches server.js)
    return [doc_to_dict(p) for p in posts]


async def create_post(db: AsyncIOMotorDatabase, username: str, content: str, reply_to: Optional[dict] = None) -> dict:
    """Create a new community post."""
    post_doc = {
        "username": username,
        "content": content,
        "timestamp": datetime.now(timezone.utc),
        "replyTo": reply_to if reply_to else None,
    }
    result = await db.posts.insert_one(post_doc)
    post_doc["_id"] = result.inserted_id
    return doc_to_dict(post_doc)


# ──────────────────────────────────────────────
# INDEXES (called once at startup)
# ──────────────────────────────────────────────

async def ensure_indexes(db: AsyncIOMotorDatabase):
    """Create MongoDB indexes matching the Mongoose schema definitions."""
    # User: unique email
    await db.users.create_index("email", unique=True)
    # Incident: compound index for fast user lookup
    await db.incidents.create_index([("userId", 1), ("createdAt", -1)])
    # Guardian: index for fast user lookup
    await db.guardians.create_index("userId")
    # Settings: unique userId
    await db.settings.create_index("userId", unique=True)
