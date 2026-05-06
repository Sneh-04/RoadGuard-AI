"""Admin routes - user management, statistics, and data export."""
import csv
import io
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ...database.db import get_db
from ...database.models import User, HazardEvent, HazardReport
from ...utils.schemas import (
    UserListResponse,
    UserProfileResponse,
    AdminStatsResponse,
)
from ..security import get_admin_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.put(
    "/users/{user_id}/ban",
    summary="Ban user",
    description="Ban a user account (admin only).",
)
async def ban_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Ban a user account.
    
    Args:
        user_id: ID of user to ban
        current_user: Authenticated admin user
        db: Database session
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If user not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    user.is_banned = True
    db.commit()
    
    logger.info(f"User banned by admin {current_user.username}: {user.username}")
    
    return {"message": f"User {user.username} has been banned"}


@router.put(
    "/users/{user_id}/unban",
    summary="Unban user",
    description="Unban a user account (admin only).",
)
async def unban_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Unban a user account.
    
    Args:
        user_id: ID of user to unban
        current_user: Authenticated admin user
        db: Database session
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If user not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    user.is_banned = False
    db.commit()
    
    logger.info(f"User unbanned by admin {current_user.username}: {user.username}")
    
    return {"message": f"User {user.username} has been unbanned"}


@router.get(
    "/users",
    response_model=UserListResponse,
    summary="List all users",
    description="Get list of all users with their details (admin only).",
)
async def list_users(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> UserListResponse:
    """Get list of all users.
    
    Args:
        current_user: Authenticated admin user
        db: Database session
        
    Returns:
        UserListResponse with all users
    """
    users = db.query(User).all()
    
    user_profiles = [
        UserProfileResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            role=user.role,
            is_active=user.is_active,
            is_banned=user.is_banned,
            created_at=user.created_at,
            last_login=user.last_login
        )
        for user in users
    ]
    
    return UserListResponse(
        users=user_profiles,
        total_count=len(user_profiles)
    )


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Get admin statistics",
    description="Get comprehensive statistics for admin dashboard (admin only).",
)
async def get_admin_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> AdminStatsResponse:
    """Get admin statistics.
    
    Args:
        current_user: Authenticated admin user
        db: Database session
        
    Returns:
        AdminStatsResponse with statistics
    """
    total_events = db.query(HazardEvent).count()
    
    # Events by label
    events_by_label = {}
    for event in db.query(HazardEvent).all():
        label_name = event.label_name or f"label_{event.label}"
        events_by_label[label_name] = events_by_label.get(label_name, 0) + 1
    
    # Events in last 24 hours
    yesterday = datetime.utcnow() - timedelta(days=1)
    events_last_24h = db.query(HazardEvent).filter(HazardEvent.timestamp >= yesterday).count()
    
    # Events by hour (simplified - last 24 hours grouped by hour)
    events_by_hour = []
    for hour in range(24):
        hour_start = datetime.utcnow().replace(hour=hour, minute=0, second=0, microsecond=0)
        hour_end = hour_start + timedelta(hours=1)
        count = db.query(HazardEvent).filter(
            HazardEvent.timestamp >= hour_start,
            HazardEvent.timestamp < hour_end
        ).count()
        events_by_hour.append({"hour": str(hour), "count": count})
    
    # Top hazard locations (simplified)
    top_locations = []
    
    # User counts
    active_users_count = db.query(User).filter(
        User.is_active == True,
        User.is_banned == False
    ).count()
    total_users_count = db.query(User).count()
    
    return AdminStatsResponse(
        total_events=total_events,
        events_by_label=events_by_label,
        events_last_24h=events_last_24h,
        events_by_hour=events_by_hour,
        top_hazard_locations=top_locations,
        active_users_count=active_users_count,
        total_users_count=total_users_count
    )


@router.get(
    "/export/csv",
    summary="Export hazard events as CSV",
    description="Download all hazard events as CSV file (admin only).",
)
async def export_csv(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Export hazard events as CSV file.
    
    Args:
        current_user: Authenticated admin user
        db: Database session
        
    Returns:
        StreamingResponse with CSV file
    """
    events = db.query(HazardEvent).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'id', 'timestamp', 'latitude', 'longitude', 'label', 'label_name',
        'p_sensor', 'p_vision', 'p_final', 'confidence', 'is_duplicate'
    ])
    
    # Write data
    for event in events:
        writer.writerow([
            event.id,
            event.timestamp.isoformat() if event.timestamp else '',
            event.latitude,
            event.longitude,
            event.label,
            event.label_name,
            event.p_sensor,
            event.p_vision,
            event.p_final,
            event.confidence,
            event.is_duplicate
        ])
    
    output.seek(0)
    
    def generate():
        yield output.getvalue()
    
    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hazard_events.csv"}
    )


@router.get(
    "/export/pdf",
    summary="Export summary report as PDF",
    description="Download summary statistics report as PDF (admin only).",
)
async def export_pdf(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Export summary report as PDF.
    
    Args:
        current_user: Authenticated admin user
        db: Database session
        
    Returns:
        StreamingResponse with PDF file
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    from io import BytesIO
    
    # Get data
    total_events = db.query(HazardEvent).count()
    events_by_label = {}
    for event in db.query(HazardEvent).all():
        label_name = event.label_name or f"label_{event.label}"
        events_by_label[label_name] = events_by_label.get(label_name, 0) + 1
    
    # Create PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    story.append(Paragraph("RoadGuard-AI Hazard Report", styles['Title']))
    story.append(Spacer(1, 12))
    
    # Summary stats
    story.append(Paragraph(f"Total Events: {total_events}", styles['Normal']))
    story.append(Spacer(1, 6))
    
    # Events by type table
    data = [['Hazard Type', 'Count']]
    for label, count in events_by_label.items():
        data.append([label, str(count)])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(table)
    
    doc.build(story)
    buffer.seek(0)
    
    def generate():
        yield buffer.getvalue()
    
    return StreamingResponse(
        generate(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=hazard_report.pdf"}
    )


@router.get(
    "/reports",
    summary="Get all hazard reports",
    description="Get list of all user-submitted hazard reports (admin only)",
)
async def get_hazard_reports(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get hazard reports, optionally filtered by status.
    
    Args:
        status_filter: Optional status filter (pending, reviewed, resolved)
        current_user: Authenticated admin user
        db: Database session
        
    Returns:
        List of hazard reports
    """
    try:
        query = db.query(HazardReport)
        
        if status_filter and status_filter in ["pending", "reviewed", "resolved"]:
            query = query.filter(HazardReport.status == status_filter)
        
        reports = query.order_by(HazardReport.created_at.desc()).all()
        
        report_list = []
        for report in reports:
            report_list.append({
                "id": report.id,
                "user_id": report.user_id,
                "latitude": report.latitude,
                "longitude": report.longitude,
                "description": report.description,
                "image_path": report.image_path,
                "status": report.status,
                "created_at": report.created_at.isoformat(),
                "reviewed_at": report.reviewed_at.isoformat() if report.reviewed_at else None,
                "resolved_at": report.resolved_at.isoformat() if report.resolved_at else None,
            })
        
        return {
            "success": True,
            "reports": report_list,
            "total_count": len(report_list),
        }
        
    except Exception as e:
        logger.error(f"Error fetching hazard reports: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch reports: {str(e)}"
        )


@router.put(
    "/reports/{report_id}/status",
    summary="Update report status",
    description="Update the status of a hazard report (admin only)",
)
async def update_report_status(
    report_id: int,
    status: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update hazard report status.
    
    Args:
        report_id: ID of report to update
        status: New status (pending, reviewed, resolved)
        current_user: Authenticated admin user
        db: Database session
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If status invalid or report not found
    """
    try:
        if status not in ["pending", "reviewed", "resolved"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid status. Must be 'pending', 'reviewed', or 'resolved'"
            )
        
        report = db.query(HazardReport).filter(HazardReport.id == report_id).first()
        if not report:
            raise HTTPException(
                status_code=404,
                detail="Report not found"
            )
        
        old_status = report.status
        report.status = status
        
        if status == "reviewed":
            report.reviewed_at = datetime.utcnow()
        elif status == "resolved":
            report.resolved_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"Report {report_id} status updated from '{old_status}' to '{status}' by admin {current_user.username}")
        
        return {
            "success": True,
            "message": f"Report status updated to {status}",
            "report_id": report_id,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating report status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update status: {str(e)}"
        )
