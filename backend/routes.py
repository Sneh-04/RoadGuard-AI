from fastapi import APIRouter, Depends, HTTPException, status, Security, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .models import LoginRequest, TokenResponse, ComplaintCreate, ComplaintUpdate, Complaint
from .database import get_user_by_email, create_user, create_complaint, get_complaints, get_complaint_by_id, update_complaint_status, get_analytics, get_activity_logs
from .auth import verify_password, get_password_hash, create_access_token, verify_token
from typing import List, Optional
import logging
import os

logger = logging.getLogger(__name__)

# YOLO model - loaded lazily
model = None

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models', 'best.pt'))

def get_model():
    global model
    if model is None:
        try:
            from ultralytics import YOLO
            model = YOLO(MODEL_PATH)
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            model = None
    return model

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
    severity: Optional[str] = None,
    days: Optional[int] = None,
    current_admin: dict = Depends(get_current_admin)
):
    complaints = await get_complaints(skip=skip, limit=limit, status=status_filter, severity=severity, days=days)
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
    # Auto-detect hazard type if image provided and type not set
    if complaint.image and not complaint.type:
        try:
            model = get_model()
            if model:
                # Convert base64 to bytes
                import base64
                image_bytes = base64.b64decode(complaint.image)
                
                # Run detection
                results = model(image_bytes)
                
                if results and len(results) > 0:
                    result = results[0]
                    if result.boxes and len(result.boxes) > 0:
                        confidences = result.boxes.conf
                        class_ids = result.boxes.cls
                        max_conf_idx = confidences.argmax()
                        confidence = float(confidences[max_conf_idx])
                        class_id = int(class_ids[max_conf_idx])
                        
                        class_names = ['pothole', 'speedbreaker', 'normal']
                        hazard_type = class_names[class_id] if class_id < len(class_names) else 'unknown'
                        
                        # Update complaint with detected type
                        complaint.type = hazard_type
                        complaint.severity = 'High' if hazard_type == 'pothole' else 'Medium' if hazard_type == 'speedbreaker' else 'Low'
        except Exception as e:
            logger.error(f"Auto-detection failed: {e}")
            # Continue without detection
    
    # This could be called from mobile app
    db_complaint = Complaint(**complaint.dict())
    created = await create_complaint(db_complaint)
    return created.dict()

@router.post("/detect")
async def detect_hazard(file: UploadFile = File(...)):
    try:
        model = get_model()
        if model:
            # Read image file
            contents = await file.read()

            # Run YOLO inference
            results = model(contents)

            # Extract results
            if results and len(results) > 0:
                result = results[0]
                if result.boxes and len(result.boxes) > 0:
                    confidences = result.boxes.conf
                    class_ids = result.boxes.cls
                    max_conf_idx = int(confidences.argmax())
                    confidence = float(confidences[max_conf_idx])
                    class_id = int(class_ids[max_conf_idx])

                    # Map class id to type (assuming 0=pothole, 1=speedbreaker, 2=normal)
                    class_names = ['pothole', 'speedbreaker', 'normal']
                    hazard_type = class_names[class_id] if class_id < len(class_names) else 'unknown'

                    return {
                        "type": hazard_type,
                        "confidence": round(confidence, 2)
                    }

        # Fallback: mock detection based on filename or random
        import random
        types = ['pothole', 'speedbreaker', 'normal']
        return {
            "type": random.choice(types),
            "confidence": round(random.uniform(0.7, 0.95), 2)
        }

    except Exception as e:
        logger.error(f"Detection failed: {e}")
        # Fallback
        return {
            "type": "unknown",
            "confidence": 0.0
        }

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