"""Event routes - hazard event retrieval, updates, and user reporting."""
import logging
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from ...database.db import get_db, get_all_events, get_events_by_label
from ...database.models import User, HazardReport, HazardEvent
from ..security import get_current_user, get_admin_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Events", "Reporting"])

# Demo data for frontend display
demo_events = [
    {
        "id": 1,
        "label": "POTHOLE",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "status": "ACTIVE"
    },
    {
        "id": 2,
        "label": "SPEEDBREAKER",
        "latitude": 12.9720,
        "longitude": 77.5950,
        "status": "ACTIVE"
    }
]


@router.get(
    "/events",
    summary="Get all hazard events",
    description="Retrieve all stored hazard detection events",
)
def get_events(db: Session = Depends(get_db), include_duplicates: bool = False):
    """Get all hazard events from database, plus demo data.
    
    Args:
        db: Database session
        include_duplicates: Whether to include duplicate detections
        
    Returns:
        Dictionary with events list
    """
    try:
        events = get_all_events(db, include_duplicates)
        # Convert to dict format
        event_list = []
        for event in events:
            event_list.append({
                "id": event.id,
                "timestamp": event.timestamp.isoformat(),
                "latitude": event.latitude,
                "longitude": event.longitude,
                "label": event.label,
                "label_name": event.label_name,
                "p_sensor": event.p_sensor,
                "p_vision": event.p_vision,
                "p_final": event.p_final,
                "confidence": event.confidence,
                "is_duplicate": event.is_duplicate,
                "status": "ACTIVE"
            })
        
        # Add demo data
        event_list.extend(demo_events)
        
        return {"events": event_list}
    except Exception as e:
        logger.error(f"Error retrieving events: {e}", exc_info=True)
        # Return demo data as fallback
        return {"events": demo_events}


@router.get(
    "/events/{label}",
    summary="Get events by hazard type",
    description="Retrieve hazard events filtered by label (0=Normal, 1=SpeedBreaker, 2=Pothole)",
)
def get_events_by_type(
    label: int,
    db: Session = Depends(get_db),
    include_duplicates: bool = False
):
    """Get hazard events filtered by label.
    
    Args:
        label: Hazard type (0=Normal, 1=SpeedBreaker, 2=Pothole)
        db: Database session
        include_duplicates: Whether to include duplicate detections
        
    Returns:
        Dictionary with filtered events list
        
    Raises:
        HTTPException: If label is invalid
    """
    if label not in [0, 1, 2]:
        raise HTTPException(
            status_code=400,
            detail="Label must be 0 (Normal), 1 (SpeedBreaker), or 2 (Pothole)"
        )
    
    try:
        events = get_events_by_label(db, label, include_duplicates)
        # Convert to dict format
        event_list = []
        for event in events:
            event_list.append({
                "id": event.id,
                "timestamp": event.timestamp.isoformat(),
                "latitude": event.latitude,
                "longitude": event.longitude,
                "label": event.label,
                "label_name": event.label_name,
                "p_sensor": event.p_sensor,
                "p_vision": event.p_vision,
                "p_final": event.p_final,
                "confidence": event.confidence,
                "is_duplicate": event.is_duplicate
            })
        return {"events": event_list}
    except Exception as e:
        logger.error(f"Error retrieving events by label {label}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve events")


@router.patch(
    "/events/{event_id}/solve",
    summary="Mark event as solved",
    description="Update a hazard event status to SOLVED",
)
def solve_event(event_id: int):
    """Mark a demo event as solved.
    
    Args:
        event_id: ID of event to mark as solved
        
    Returns:
        Success message with updated status
        
    Raises:
        HTTPException: If event not found
    """
    for event in demo_events:
        if event["id"] == event_id:
            event["status"] = "SOLVED"
            logger.info(f"Event {event_id} marked as SOLVED")
            return {"message": "updated", "status": "SOLVED"}
    
    # Not found in demo data - would search DB in production
    raise HTTPException(status_code=404, detail=f"Event {event_id} not found")


@router.patch(
    "/events/{event_id}/ignore",
    summary="Mark event as ignored",
    description="Update a hazard event status to IGNORED",
)
def ignore_event(event_id: int):
    """Mark a demo event as ignored.
    
    Args:
        event_id: ID of event to mark as ignored
        
    Returns:
        Success message with updated status
        
    Raises:
        HTTPException: If event not found
    """
    for event in demo_events:
        if event["id"] == event_id:
            event["status"] = "IGNORED"
            logger.info(f"Event {event_id} marked as IGNORED")
            return {"message": "updated", "status": "IGNORED"}
    
    # Not found in demo data - would search DB in production
    raise HTTPException(status_code=404, detail=f"Event {event_id} not found")


@router.post(
    "/hazards/report",
    summary="Report a hazard via image upload",
    description="Users can report a detected hazard with an image and location",
)
async def report_hazard(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: str = Form(default="Road hazard detected"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a hazard report with image.
    
    Args:
        image: Image file of hazard
        latitude: Latitude of hazard location
        longitude: Longitude of hazard location
        description: Description of hazard
        current_user: Authenticated user submitting report
        db: Database session
        
    Returns:
        Success message with report ID
        
    Raises:
        HTTPException: If image processing fails
    """
    try:
        # Create reports directory if it doesn't exist
        os.makedirs("reports", exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(image.filename)[1] if image.filename else '.jpg'
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        filepath = os.path.join("reports", unique_filename)
        
        # Save image
        contents = await image.read()
        with open(filepath, 'wb') as f:
            f.write(contents)
        
        # Create hazard report record
        report = HazardReport(
            user_id=current_user.id,
            latitude=latitude,
            longitude=longitude,
            description=description,
            image_path=filepath,
            status="pending"
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        logger.info(
            f"Hazard report {report.id} submitted by user {current_user.username} "
            f"at ({latitude}, {longitude})"
        )
        
        return {
            "success": True,
            "message": "Hazard report submitted successfully",
            "report_id": report.id,
            "status": report.status,
        }
        
    except Exception as e:
        logger.error(f"Error processing hazard report: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process report: {str(e)}"
        )
