from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from bson import ObjectId
from models import User, Complaint, ActivityLog
from datetime import datetime, timedelta
from typing import List, Optional
import logging
from geopy.distance import geodesic
import os

logger = logging.getLogger(__name__)

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "roadguard_admin"

client: Optional[AsyncIOMotorClient] = None
db = None

# In-memory fallback storage
_memory_users = []
_memory_complaints = []
_memory_activity = []

USE_MEMORY = False

async def init_db():
    global client, db, USE_MEMORY
    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        # Test connection
        await client.admin.command('ping')
        logger.info("Connected to MongoDB")
        USE_MEMORY = False
        return True
    except Exception as e:
        logger.warning(f"Failed to connect to MongoDB: {e}. Using in-memory storage.")
        USE_MEMORY = True
        return False

async def close_db():
    if client:
        client.close()

# User operations
async def get_user_by_email(email: str) -> Optional[User]:
    if USE_MEMORY:
        user_data = next((u for u in _memory_users if u["email"] == email), None)
        return User(**user_data) if user_data else None
    user_data = await db.users.find_one({"email": email})
    if user_data:
        return User(**user_data)
    return None

async def create_user(email: str, hashed_password: str) -> User:
    user = User(email=email, hashed_password=hashed_password)
    if USE_MEMORY:
        _memory_users.append(user.dict(by_alias=True))
        return user
    await db.users.insert_one(user.dict(by_alias=True))
    return user

# Complaint operations
async def create_complaint(complaint: Complaint) -> Complaint:
    # Calculate severity based on nearby complaints
    severity = await calculate_severity(complaint.latitude, complaint.longitude)
    complaint.severity = severity
    if USE_MEMORY:
        _memory_complaints.append(complaint.dict(by_alias=True))
        return complaint
    await db.complaints.insert_one(complaint.dict(by_alias=True))
    return complaint

async def get_complaints(skip: int = 0, limit: int = 100, status: Optional[str] = None,
                        severity: Optional[str] = None, days: Optional[int] = None) -> List[Complaint]:
    if USE_MEMORY:
        complaints = _memory_complaints.copy()
    else:
        query = {}
        if status:
            query["status"] = status
        if severity:
            query["severity"] = severity
        if days:
            cutoff = datetime.utcnow() - timedelta(days=days)
            query["timestamp"] = {"$gte": cutoff}

        cursor = db.complaints.find(query).sort("timestamp", -1).skip(skip).limit(limit)
        complaints = []
        async for doc in cursor:
            complaints.append(doc)

    result = []
    for c in complaints[-limit:]:  # Simple pagination for memory
        result.append(Complaint(**c))
    return result

async def get_complaint_by_id(complaint_id: str) -> Optional[Complaint]:
    if USE_MEMORY:
        complaint_data = next((c for c in _memory_complaints if str(c["_id"]) == complaint_id), None)
        return Complaint(**complaint_data) if complaint_data else None
    doc = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if doc:
        return Complaint(**doc)
    return None

async def update_complaint_status(complaint_id: str, status: str, admin_id: str) -> bool:
    update_data = {"status": status}
    if status == "Resolved":
        update_data["resolved_at"] = datetime.utcnow()

    if USE_MEMORY:
        for c in _memory_complaints:
            if str(c["_id"]) == complaint_id:
                c.update(update_data)
                await log_activity(admin_id, "status_change", complaint_id, {"new_status": status})
                return True
        return False

    result = await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$set": update_data}
    )

    if result.modified_count > 0:
        # Log activity
        await log_activity(admin_id, "status_change", complaint_id, {"new_status": status})
        return True
    return False

async def update_complaint_priority(complaint_id: str, priority: str) -> bool:
    result = await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$set": {"priority": priority}}
    )
    return result.modified_count > 0

async def calculate_severity(lat: float, lng: float) -> str:
    if USE_MEMORY:
        complaints = _memory_complaints
    else:
        cutoff = datetime.utcnow() - timedelta(days=30)
        complaints = []
        async for doc in db.complaints.find({"timestamp": {"$gte": cutoff}}):
            complaints.append(doc)

    # Count complaints within approximate 1km radius
    count = 0
    for c in complaints:
        if abs(c.get("latitude", 0) - lat) < 0.01 and abs(c.get("longitude", 0) - lng) < 0.01:
            count += 1

    if count >= 5:
        return "High"
    elif count >= 2:
        return "Medium"
    return "Low"

# Analytics
async def get_analytics():
    if USE_MEMORY:
        complaints = _memory_complaints
    else:
        complaints = []
        async for doc in db.complaints.find():
            complaints.append(doc)

    total = len(complaints)
    solved = sum(1 for c in complaints if c.get("status") == "solved")
    pending = sum(1 for c in complaints if c.get("status") == "pending")
    in_progress = sum(1 for c in complaints if c.get("status") == "in_progress")
    ignored = sum(1 for c in complaints if c.get("status") == "ignored")

    # Daily reports (last 7 days)
    daily = []
    for i in range(7):
        date = datetime.utcnow() - timedelta(days=i)
        start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        count = sum(1 for c in complaints if start <= c.get("timestamp", datetime.min) < end)
        daily.append({"date": start.strftime("%Y-%m-%d"), "count": count})

    # Weekly reports (last 4 weeks)
    weekly = []
    for i in range(4):
        week_start = datetime.utcnow() - timedelta(weeks=i+1)
        week_end = datetime.utcnow() - timedelta(weeks=i)
        count = sum(1 for c in complaints if week_start <= c.get("timestamp", datetime.min) < week_end)
        weekly.append({"week": f"Week {4-i}", "count": count})

    # Most affected areas (group by rounded coordinates)
    areas = {}
    for c in complaints:
        lat = round(c.get("latitude", 0), 2)
        lng = round(c.get("longitude", 0), 2)
        key = f"{lat},{lng}"
        areas[key] = areas.get(key, {"lat": lat, "lng": lng, "count": 0})
        areas[key]["count"] += 1

    most_affected = sorted(areas.values(), key=lambda x: x["count"], reverse=True)[:10]

    return {
        "total_reports": total,
        "solved": solved,
        "pending": pending,
        "in_progress": in_progress,
        "ignored": ignored,
        "daily_reports": daily,
        "weekly_reports": weekly,
        "most_affected_areas": most_affected
    }

# Activity logs
async def log_activity(admin_id: str, action: str, complaint_id: Optional[str] = None, details: dict = {}):
    log = ActivityLog(admin_id=admin_id, action=action, complaint_id=complaint_id, details=details)
    if USE_MEMORY:
        _memory_activity.append(log.dict(by_alias=True))
        return
    await db.activity_logs.insert_one(log.dict(by_alias=True))

async def get_activity_logs(skip: int = 0, limit: int = 50) -> List[ActivityLog]:
    if USE_MEMORY:
        logs = _memory_activity[-limit:] if limit else _memory_activity
        return [ActivityLog(**log) for log in logs]

    cursor = db.activity_logs.find().sort("timestamp", -1).skip(skip).limit(limit)
    logs = []
    async for doc in cursor:
        logs.append(ActivityLog(**doc))
    return logs