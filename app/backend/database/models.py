"""Database models using SQLAlchemy."""
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()


class HazardEvent(Base):
    """Database model for hazard detection events."""
    __tablename__ = "hazard_events"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    label = Column(Integer, nullable=False)  # 0=Normal, 1=SpeedBreaker, 2=Pothole
    label_name = Column(String, nullable=False)
    p_sensor = Column(Float, nullable=True)
    p_vision = Column(Float, nullable=True)
    p_final = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    is_duplicate = Column(Boolean, default=False)


class User(Base):
    """Database model for users."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # "user" or "admin"
    is_active = Column(Boolean, default=True)
    is_banned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)


class HazardReport(Base):
    """Database model for user-submitted hazard reports with images."""
    __tablename__ = "hazard_reports"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    image_path = Column(String, nullable=False)  # Path to stored image
    status = Column(String, default="pending")  # pending, reviewed, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)