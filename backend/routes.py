from fastapi import APIRouter, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models import LoginRequest, TokenResponse, ComplaintCreate, ComplaintUpdate, Complaint
from database import get_user_by_email, create_user, create_complaint, get_complaints, get_complaint_by_id, update_complaint_status, get_analytics, get_activity_logs
from auth import verify_password, get_password_hash, create_access_token, verify_token
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer(auto_error=False)

async def get_current_admin(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)):
    """Optional auth for demo mode"""
    # If no credentials provided, return demo admin
    if not credentials:
        return {"email": "demo@roadguard.in", "id": "demo-admin", "is_active": True}
    
    try:
        token = credentials.credentials
        email = verify_token(token)
        if not email:
            return {"email": "demo@roadguard.in", "id": "demo-admin", "is_active": True}
        user = await get_user_by_email(email)
        if not user or not user.is_active:
            return {"email": "demo@roadguard.in", "id": "demo-admin", "is_active": True}
        return user
    except Exception:
        return {"email": "demo@roadguard.in", "id": "demo-admin", "is_active": True}

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    user = await get_user_by_email(request.email)
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register")
async def register(email: str, password: str):
    # For demo purposes - in production, restrict this
    if await get_user_by_email(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

    hashed_password = get_password_hash(password)
    await create_user(email, hashed_password)
    return {"message": "User created"}

@router.get("/complaints")
async def get_complaints_endpoint(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    priority: Optional[str] = None,
    days: Optional[int] = None,
    current_admin: dict = Depends(get_current_admin)
):
    complaints = await get_complaints(skip=skip, limit=limit, status=status_filter, priority=priority, days=days)
    return {"complaints": [complaint.dict() for complaint in complaints], "total": len(complaints)}

@router.get("/complaints/{complaint_id}")
async def get_complaint(complaint_id: str, current_admin: dict = Depends(get_current_admin)):
    complaint = await get_complaint_by_id(complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    return complaint.dict()

@router.put("/complaints/{complaint_id}/status")
async def update_status(
    complaint_id: str,
    update: ComplaintUpdate,
    current_admin: dict = Depends(get_current_admin)
):
    if not update.status:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status required")

    success = await update_complaint_status(complaint_id, update.status, str(current_admin.id))
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    return {"message": "Status updated"}

@router.post("/complaints")
async def create_complaint_endpoint(complaint: ComplaintCreate):
    # This could be called from mobile app
    db_complaint = Complaint(**complaint.dict())
    created = await create_complaint(db_complaint)
    return created.dict()

@router.get("/analytics")
async def get_analytics_endpoint(current_admin: dict = Depends(get_current_admin)):
    return await get_analytics()

@router.get("/activity")
async def get_activity_logs_endpoint(
    skip: int = 0,
    limit: int = 50,
    current_admin: dict = Depends(get_current_admin)
):
    logs = await get_activity_logs(skip=skip, limit=limit)
    return {"logs": [log.dict() for log in logs]}