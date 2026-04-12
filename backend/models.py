from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string"}

# User Model
class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# Complaint Model
class Complaint(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str
    image: Optional[str] = None  # base64 or URL
    latitude: float
    longitude: float
    address: Optional[str] = None
    description: str
    status: str = "Pending"  # Pending, In Progress, Resolved, Rejected
    priority: str = "Low"  # Low, Medium, High
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# Activity Log Model
class ActivityLog(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    admin_id: str
    action: str  # status_change, delete, etc.
    complaint_id: Optional[str]
    details: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

# API Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class ComplaintCreate(BaseModel):
    user_id: str
    image: Optional[str]
    latitude: float
    longitude: float
    address: Optional[str]
    description: str

class ComplaintUpdate(BaseModel):
    status: Optional[str]
    priority: Optional[str]

class AnalyticsResponse(BaseModel):
    total_reports: int
    resolved: int
    pending: int
    in_progress: int
    daily_reports: List[dict]
    weekly_reports: List[dict]
    most_affected_areas: List[dict]