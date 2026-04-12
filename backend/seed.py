import asyncio
from database import init_db, create_user, create_complaint
from models import Complaint
from auth import get_password_hash
from datetime import datetime, timedelta
import random

async def seed_data():
    await init_db()

    # Create admin user
    try:
        hashed_password = get_password_hash("roadguard@admin2024"[:50])  # Truncate to avoid bcrypt limit
        admin = await create_user("admin@roadguard.in", hashed_password)
        print(f"Created admin user: {admin.email}")
    except Exception as e:
        print(f"Admin user might already exist: {e}")

    # Sample complaints data
    sample_complaints = [
        {
            "user_id": "user_001",
            "description": "Large pothole on Main Street causing traffic issues",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "address": "Main Street, Chennai",
            "status": "Pending",
            "timestamp": datetime.utcnow() - timedelta(days=1),
        },
        {
            "user_id": "user_002",
            "description": "Speed breaker too high, dangerous for vehicles",
            "latitude": 13.0850,
            "longitude": 80.2750,
            "address": "Park Street, Chennai",
            "status": "In Progress",
            "timestamp": datetime.utcnow() - timedelta(hours=12),
        },
        {
            "user_id": "user_003",
            "description": "Multiple potholes in residential area",
            "latitude": 13.0800,
            "longitude": 80.2650,
            "address": "Residential Road, Chennai",
            "status": "Resolved",
            "timestamp": datetime.utcnow() - timedelta(days=3),
        },
        {
            "user_id": "user_004",
            "description": "Broken traffic signal at intersection",
            "latitude": 13.0900,
            "longitude": 80.2800,
            "address": "Central Junction, Chennai",
            "status": "Pending",
            "timestamp": datetime.utcnow() - timedelta(hours=6),
        },
        {
            "user_id": "user_005",
            "description": "Flooded road after heavy rain",
            "latitude": 13.0750,
            "longitude": 80.2600,
            "address": "Low-lying Area, Chennai",
            "status": "Pending",
            "timestamp": datetime.utcnow() - timedelta(hours=2),
        },
    ]

    for complaint_data in sample_complaints:
        try:
            complaint = Complaint(**complaint_data)
            created = await create_complaint(complaint)
            print(f"Created complaint: {created.description[:30]}...")
        except Exception as e:
            print(f"Error creating complaint: {e}")

    print("Seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed_data())