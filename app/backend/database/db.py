"""Database connection and operations."""
import os
from pathlib import Path
from typing import List
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from .models import Base, HazardEvent


# Database path
DB_PATH = Path("data") / "roadguard.db"
DB_URL = f"sqlite:///{DB_PATH}"

# Create engine and session
engine = create_engine(DB_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_db():
    """Create database tables."""
    os.makedirs(DB_PATH.parent, exist_ok=True)
    Base.metadata.create_all(bind=engine)


def get_db() -> Session:
    """Get database session."""
    return SessionLocal()


def save_event(db: Session, event: dict):
    """Save a hazard event to database."""
    db_event = HazardEvent(
        timestamp=event.get("timestamp"),
        latitude=event["latitude"],
        longitude=event["longitude"],
        label=event["label"],
        label_name=event["label_name"],
        p_sensor=event.get("p_sensor"),
        p_vision=event.get("p_vision"),
        p_final=event.get("p_final"),
        confidence=event.get("confidence"),
        is_duplicate=event.get("is_duplicate", False)
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


def get_all_events(db: Session, include_duplicates: bool = False) -> List[HazardEvent]:
    """Get all hazard events."""
    query = db.query(HazardEvent)
    if not include_duplicates:
        query = query.filter(HazardEvent.is_duplicate == False)
    return query.order_by(HazardEvent.timestamp.desc()).all()


def get_events_by_label(db: Session, label: int, include_duplicates: bool = False) -> List[HazardEvent]:
    """Get events filtered by label."""
    query = db.query(HazardEvent).filter(HazardEvent.label == label)
    if not include_duplicates:
        query = query.filter(HazardEvent.is_duplicate == False)
    return query.order_by(HazardEvent.timestamp.desc()).all()