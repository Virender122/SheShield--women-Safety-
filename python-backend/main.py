"""
SheShield Women Safety API — Python/FastAPI Backend
====================================================
Direct port of server.js (Node.js/Express) to Python/FastAPI.
All endpoints, Socket.IO events, and response formats are identical.
The React frontend requires ZERO changes.
"""
import os
import re
import asyncio
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from dotenv import load_dotenv

# Load environment variables BEFORE importing anything that uses them
load_dotenv()

from fastapi import FastAPI, Request, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import socketio
from motor.motor_asyncio import AsyncIOMotorClient

from auth import hash_password, verify_password, create_token, get_current_user
from models import (
    ensure_indexes,
    find_user_by_email, find_user_by_id, create_user,
    get_settings, create_default_settings, upsert_settings,
    get_guardians, replace_guardians,
    create_incident, get_user_incidents, get_recent_incidents,
    get_recent_posts, create_post,
)
from services.twilio_sms import get_twilio_client, send_sos_call, send_incident_sms
from services.gemini_bot import chat_with_gemini

# ──────────────────────────────────────────────
# LOGGING
# ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("sheshield")

# ──────────────────────────────────────────────
# FILE UPLOADS — Ensure directory exists
# ──────────────────────────────────────────────
UPLOAD_DIR = Path(__file__).parent / "uploads" / "incidents"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ──────────────────────────────────────────────
# MONGODB
# ──────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/women-safety")
mongo_client: AsyncIOMotorClient = None
db = None

# ──────────────────────────────────────────────
# SOCKET.IO — Create async server
# ──────────────────────────────────────────────
# CORS origins for Socket.IO
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
ALLOWED_ORIGINS_LIST = list(filter(None, [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]))

# Regex pattern matching the same origins as the Node.js server
CORS_ORIGIN_REGEX = re.compile(
    r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|"
    r"172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|"
    r".*\.ngrok-free\.app|.*\.ngrok\.io|.*\.localtunnel\.me|.*\.loca\.lt|"
    r".*\.pinggy(-free)?\.link|.*\.vercel\.app)(:\d+)?$"
)


def is_origin_allowed(origin: str) -> bool:
    """Check if an origin is allowed — matches the Node.js CORS logic."""
    if not origin:
        return True  # Allow requests with no origin (mobile apps, curl, postman)
    return origin in ALLOWED_ORIGINS_LIST or bool(CORS_ORIGIN_REGEX.match(origin))


# Create Socket.IO async server
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=lambda origin, _: is_origin_allowed(origin),
)


@sio.event
async def connect(sid, environ):
    logger.info(f"🔌 User connected: {sid}")


@sio.event
async def disconnect(sid):
    logger.info(f"🔌 User disconnected: {sid}")


# ──────────────────────────────────────────────
# RATE LIMITER
# ──────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ──────────────────────────────────────────────
# FASTAPI APP — Lifespan for startup/shutdown
# ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect to MongoDB. Shutdown: close connection."""
    global mongo_client, db
    logger.info("🛡️  SheShield Python Backend starting...")

    mongo_client = AsyncIOMotorClient(MONGO_URI)
    db = mongo_client.get_default_database()
    logger.info("✅ MongoDB connected")

    # Create indexes
    await ensure_indexes(db)

    # Log Twilio status
    twilio_configured = bool(
        os.getenv("TWILIO_ACCOUNT_SID") and
        os.getenv("TWILIO_AUTH_TOKEN") and
        os.getenv("TWILIO_ACCOUNT_SID") != "your_twilio_account_sid"
    )
    if twilio_configured:
        logger.info(f"📱 Twilio configured - SOS SMS will be sent from {os.getenv('TWILIO_PHONE_NUMBER')}")
    else:
        logger.info("⚠️  Twilio not configured - SOS SMS disabled. Update .env to enable.")

    yield  # App is running

    # Shutdown
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB connection closed")


app = FastAPI(title="SheShield Women Safety API", lifespan=lifespan)

# Rate limit error handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"success": False, "message": "Too many attempts, please try again after 15 minutes."},
    )

app.state.limiter = limiter

# ──────────────────────────────────────────────
# CORS MIDDLEWARE
# ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS_LIST,
    allow_origin_regex=CORS_ORIGIN_REGEX.pattern,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# REQUEST LOGGING MIDDLEWARE
# ──────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    origin = request.headers.get("origin", "none")
    logger.info(f"🛡️ [REQ] {request.method} {request.url.path} | Origin: {origin}")
    response = await call_next(request)
    return response


# ──────────────────────────────────────────────
# STATIC FILES — Serve uploaded media
# ──────────────────────────────────────────────
uploads_path = Path(__file__).parent / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


# ──────────────────────────────────────────────
# HELPER — Get DB instance
# ──────────────────────────────────────────────
def get_db():
    return db


# ==========================================
# ROUTES
# ==========================================

@app.get("/")
async def root():
    return {"status": "ok", "message": "SheShield Women Safety API is running 🛡️"}


# ────────── AUTH ROUTES ──────────

@app.post("/api/auth/signup")
@limiter.limit("20/15minutes")
async def signup(request: Request):
    body = await request.json()
    name = body.get("name", "")
    email = body.get("email", "")
    password = body.get("password", "")
    phone = body.get("phone", "")

    try:
        existing = await find_user_by_email(db, email)
        if existing:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "An account with this email already exists."},
            )

        hashed = hash_password(password)
        user = await create_user(db, name, email, hashed, phone)

        # Create default settings for new user
        await create_default_settings(db, user["_id"])

        token = create_token(user["_id"])
        return {
            "success": True,
            "token": token,
            "user": {"id": user["_id"], "name": user["name"], "email": user["email"], "phone": user["phone"]},
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@app.post("/api/auth/login")
@limiter.limit("20/15minutes")
async def login(request: Request):
    body = await request.json()
    email = body.get("email", "")
    password = body.get("password", "")

    try:
        user = await find_user_by_email(db, email)
        if not user:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Invalid email or password"},
            )

        if not verify_password(password, user["password"]):
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Invalid email or password"},
            )

        token = create_token(user["_id"])
        return {
            "success": True,
            "token": token,
            "user": {"id": user["_id"], "name": user["name"], "email": user["email"], "phone": user["phone"]},
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@app.get("/api/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    try:
        user = await find_user_by_id(db, user_id)
        if not user:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "User not found"},
            )
        return {"user": {"id": user["_id"], "name": user["name"], "email": user["email"], "phone": user["phone"]}}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


# ────────── SOS ROUTES ──────────

@app.post("/api/sos/activate")
async def sos_activate(request: Request, user_id: str = Depends(get_current_user)):
    body = await request.json()
    lat = body.get("lat", "")
    lon = body.get("lon", "")
    logger.info(f"🚨 SOS Activated by user {user_id} at Lat: {lat}, Lon: {lon}")

    try:
        user = await find_user_by_id(db, user_id)
        if not user:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "User not found"},
            )

        guardians = await get_guardians(db, user_id)

        twilio_configured = bool(
            os.getenv("TWILIO_ACCOUNT_SID") and
            os.getenv("TWILIO_AUTH_TOKEN") and
            os.getenv("TWILIO_ACCOUNT_SID") != "your_twilio_account_sid"
        )

        if twilio_configured and guardians:
            # Fire-and-forget: Send SOS Call in background (parallel)
            for guardian in guardians:
                if guardian.get("phone"):
                    asyncio.create_task(
                        send_sos_call(guardian["phone"], guardian["name"], user["name"], lat, lon)
                    )

            return {
                "success": True,
                "status": "ACTIVATED",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "message": f"Emergency SOS activated! Dispatching SMS alerts to {len(guardians)} guardian(s) in background.",
            }

        # If Twilio not configured or no guardians
        message = "SOS signal activated."
        if not twilio_configured:
            message += " SMS alerts not configured — please set up Twilio in backend .env file."
        if not guardians:
            message += " No guardians configured — please add emergency contacts in Settings."

        return {
            "success": True,
            "status": "ACTIVATED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": message,
        }
    except Exception as e:
        logger.error(f"SOS Error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Failed to process SOS alert."},
        )


@app.post("/api/sos/deactivate")
async def sos_deactivate(user_id: str = Depends(get_current_user)):
    logger.info(f"✅ SOS Deactivated by user {user_id}")
    return {
        "success": True,
        "status": "DEACTIVATED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/sos/fake-call")
async def sos_fake_call(user_id: str = Depends(get_current_user)):
    return {"success": True, "delaySeconds": 30, "incomingCaller": "Mom"}


# ────────── INCIDENT ROUTES ──────────

@app.post("/api/incidents/report")
async def report_incident(
    request: Request,
    title: str = Form(""),
    description: str = Form(""),
    location: str = Form(""),
    type: str = Form("Other"),
    severity: str = Form("Medium"),
    status: str = Form("Reported"),
    lat: str = Form(""),
    lon: str = Form(""),
    media: UploadFile = File(None),
    user_id: str = Depends(get_current_user),
):
    try:
        media_url = ""
        if media and media.filename:
            # Generate unique filename — same pattern as multer in server.js
            unique_suffix = f"{int(datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:9]}"
            ext = Path(media.filename).suffix
            filename = f"{unique_suffix}{ext}"
            filepath = UPLOAD_DIR / filename
            content = await media.read()
            with open(filepath, "wb") as f:
                f.write(content)
            media_url = f"/uploads/incidents/{filename}"

        incident_data = {
            "userId": user_id,
            "title": title,
            "description": description,
            "location": location,
            "type": type,
            "severity": severity,
            "status": status,
            "lat": lat,
            "lon": lon,
            "mediaUrl": media_url,
        }

        new_incident = await create_incident(db, incident_data)

        # Broadcast new incident to all connected clients — same Socket.IO event as server.js
        await sio.emit("new_incident", new_incident)

        # Send SMS to authority if configured (fire-and-forget)
        client = get_twilio_client()
        if client:
            asyncio.create_task(send_incident_sms(client, new_incident, media_url))

        return {"success": True, "report": new_incident}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@app.get("/api/incidents/my-reports")
async def my_reports(user_id: str = Depends(get_current_user)):
    try:
        incidents = await get_user_incidents(db, user_id)
        return incidents
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@app.get("/api/incidents/all")
async def all_incidents(user_id: str = Depends(get_current_user)):
    try:
        incidents = await get_recent_incidents(db)
        return incidents
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


# ────────── COMMUNITY ROUTES ──────────

@app.get("/api/community/messages")
async def get_messages():
    try:
        posts = await get_recent_posts(db)
        return posts
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@app.post("/api/community/message")
async def post_message(request: Request, user_id: str = Depends(get_current_user)):
    body = await request.json()
    content = body.get("content", "")
    reply_to = body.get("replyTo", None)

    try:
        user = await find_user_by_id(db, user_id)
        username = user["name"] if user else "Anonymous"

        new_post = await create_post(db, username, content, reply_to)

        # Broadcast to all connected Socket.IO clients — same event as server.js
        await sio.emit("new_message", new_post)

        return new_post
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


# ────────── GUARDIAN ROUTES ──────────

@app.get("/api/guardians")
async def get_guardians_route(user_id: str = Depends(get_current_user)):
    try:
        guardians = await get_guardians(db, user_id)
        return {"success": True, "guardians": guardians}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@app.post("/api/guardians")
async def save_guardians(request: Request, user_id: str = Depends(get_current_user)):
    body = await request.json()
    guardians_list = body.get("guardians", [])

    try:
        saved = await replace_guardians(db, user_id, guardians_list)
        return {"success": True, "guardians": saved}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


# ────────── USER SETTINGS ROUTES ──────────

@app.get("/api/user/settings")
async def get_user_settings(user_id: str = Depends(get_current_user)):
    try:
        settings = await get_settings(db, user_id)
        return settings
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


@app.post("/api/user/settings")
async def save_user_settings(request: Request, user_id: str = Depends(get_current_user)):
    body = await request.json()
    try:
        settings = await upsert_settings(db, user_id, body)
        return settings
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})


# ────────── AI BOT ROUTES ──────────

@app.post("/api/bot/chat")
async def bot_chat(request: Request, user_id: str = Depends(get_current_user)):
    body = await request.json()
    message = body.get("message", "")
    history = body.get("history", [])

    try:
        response_text = await chat_with_gemini(message, history)
        return {"success": True, "response": response_text}
    except ValueError as e:
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})
    except Exception as e:
        logger.error(f"Bot Error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Failed to communicate with AI Bot."},
        )


# ────────── ROUTES OPTIMIZE (backward compatibility) ──────────

@app.post("/api/routes/optimize")
async def routes_optimize(request: Request):
    body = await request.json()
    return {
        "source": body.get("source"),
        "destination": body.get("destination"),
        "message": "Route optimization is handled client-side via OpenRouteService API.",
    }


# ==========================================
# MOUNT SOCKET.IO + RUN
# ==========================================

# Create the combined ASGI app (FastAPI + Socket.IO)
combined_app = socketio.ASGIApp(sio, app)

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 5005))
    logger.info(f"🛡️  SheShield Backend running on port {port}")
    logger.info("📡 Socket.IO ready for real-time connections")
    uvicorn.run(
        combined_app,
        host="0.0.0.0",
        port=port,
        log_level="info",
    )
