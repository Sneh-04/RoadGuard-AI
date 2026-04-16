"""Main FastAPI application - production-ready backend server.

No frontend dependencies. Backend is pure API layer.
"""
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt

from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..utils.config import (
    API_TITLE,
    API_VERSION,
    API_DESCRIPTION,
    DEVICE,
    LOG_LEVEL,
    JWT_SECRET,
    JWT_ALGORITHM,
    JWT_EXPIRY_DAYS,
)
from ..models.model_loader import get_model_loader, ModelLoadError
from ..inference.inference import get_inference_pipeline, InferenceError, HazardInferencePipeline
from ..vision.vision_inference import get_vision_pipeline
from ..database.db import create_db, get_db, save_event, get_all_events, get_events_by_label
from ..database.models import User, HazardReport
from ..utils.deduplication import is_duplicate
from ..utils.schemas import (
    PredictionRequest,
    PredictionResponse,
    MultimodalPredictionRequest,
    MultimodalPredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    HealthStatus,
    UserSignupRequest,
    UserLoginRequest,
    TokenResponse,
    UserProfileResponse,
    UserListResponse,
    AdminStatsResponse,
)

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# ============================================================================
# Authentication Utilities
# ============================================================================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=JWT_EXPIRY_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user."""
    token_data = verify_token(credentials.credentials)
    user_id = token_data.get("sub")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    if not user.is_active or user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or banned"
        )
    return user

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current user and verify admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ============================================================================
# Startup and Shutdown Events
# ============================================================================

# global loader and pipeline references (initialized during startup)
model_loader = get_model_loader()
inference_pipeline: Optional["HazardInferencePipeline"] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - startup and shutdown events."""

    # STARTUP
    logger.info("=" * 60)
    logger.info("🚀 RoadHazardProject API Starting Up")
    logger.info("=" * 60)

    try:
        # Load all models at startup (not per-request)
        status = model_loader.load_all_models()

        if not model_loader.is_ready():
            logger.warning("⚠️  Not all models loaded successfully")
            logger.warning(f"Status: {status}")
        else:
            logger.info("✅ All models loaded successfully")
            logger.info(f"Inference device: {DEVICE}")

        # Create database tables
        try:
            create_db()
            logger.info("✅ Database tables created successfully")
        except Exception as db_e:
            logger.error(f"❌ Database creation failed: {db_e}")
            # Don't crash if DB fails, but log it

        # Store loader in app state for later access
        app.state.model_loader = model_loader

        # Only initialize inference pipeline (non-critical)
        global inference_pipeline
        try:
            # deferred imports to avoid import cycles
            from ..inference.inference import get_inference_pipeline

            inference_pipeline = HazardInferencePipeline()
            # register in app state
            app.state.inference_pipeline = inference_pipeline
            logger.info("✅ Inference pipeline initialized successfully")
        except Exception as e:
            logger.warning(
                f"⚠️  Inference pipeline initialization degraded: {e}"
            )
            inference_pipeline = None
            app.state.inference_pipeline = None

    except Exception as e:
        logger.error(f"❌ Startup failed: {e}", exc_info=True)
        # do not crash entire server, mark degraded
        inference_pipeline = None
        app.state.inference_pipeline = None

    logger.info("=" * 60)
    logger.info("✅ Application ready to receive requests")
    logger.info("=" * 60)

    yield  # Application runs here

    # SHUTDOWN
    logger.info("🛑 Application shutting down...")
    logger.info("Releasing resources...")


# ============================================================================
# Create FastAPI App
# ============================================================================

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    lifespan=lifespan,
)


# ============================================================================
# CORS Middleware - Allow frontend and external clients
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (customize for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Global Exception Handler
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions with structured error response."""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
        }
    )


# ============================================================================
# Authentication Endpoints
# ============================================================================

@app.post(
    "/api/auth/signup",
    response_model=TokenResponse,
    tags=["Authentication"],
    summary="User signup",
    description="Create a new user account and return authentication token."
)
async def signup(
    request: UserSignupRequest,
    db: Session = Depends(get_db)
) -> TokenResponse:
    """Create a new user account."""
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == request.username).first()
    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    # Validate role
    if request.role not in ["user", "admin"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Must be 'user' or 'admin'"
        )
    
    # Hash password
    hashed_password = hash_password(request.password)
    
    # Create user
    user = User(
        email=request.email,
        username=request.username,
        hashed_password=hashed_password,
        role=request.role
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create token
    token = create_access_token({"sub": str(user.id), "username": user.username, "role": user.role})
    
    logger.info(f"New user registered: {user.username} ({user.role})")
    
    return TokenResponse(
        token=token,
        user_id=user.id,
        username=user.username,
        role=user.role
    )


@app.post(
    "/api/auth/login",
    response_model=TokenResponse,
    tags=["Authentication"],
    summary="User login",
    description="Authenticate user and return JWT token."
)
async def login(
    request: UserLoginRequest,
    db: Session = Depends(get_db)
) -> TokenResponse:
    """Authenticate user."""
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    
    # Check if user is active and not banned
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Account is deactivated"
        )
    if user.is_banned:
        raise HTTPException(
            status_code=403,
            detail="Account is banned"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create token
    token = create_access_token({"sub": str(user.id), "username": user.username, "role": user.role})
    
    logger.info(f"User logged in: {user.username}")
    
    return TokenResponse(
        token=token,
        user_id=user.id,
        username=user.username,
        role=user.role
    )


@app.get(
    "/api/auth/me",
    response_model=UserProfileResponse,
    tags=["Authentication"],
    summary="Get current user profile",
    description="Get profile information for the currently authenticated user."
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserProfileResponse:
    """Get current user profile."""
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        is_active=current_user.is_active,
        is_banned=current_user.is_banned,
        created_at=current_user.created_at,
        last_login=current_user.last_login
    )


@app.put(
    "/api/admin/users/{user_id}/ban",
    tags=["Admin"],
    summary="Ban user",
    description="Ban a user account (admin only)."
)
async def ban_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Ban a user."""
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


@app.put(
    "/api/admin/users/{user_id}/unban",
    tags=["Admin"],
    summary="Unban user",
    description="Unban a user account (admin only)."
)
async def unban_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Unban a user."""
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


@app.get(
    "/api/admin/users",
    response_model=UserListResponse,
    tags=["Admin"],
    summary="List all users",
    description="Get list of all users with their details (admin only)."
)
async def list_users(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
) -> UserListResponse:
    """List all users."""
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


@app.get(
    "/api/admin/stats",
    response_model=AdminStatsResponse,
    tags=["Admin"],
    summary="Get admin statistics",
    description="Get comprehensive statistics for admin dashboard (admin only)."
)
async def get_admin_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
) -> AdminStatsResponse:
    """Get admin statistics."""
    # This is a simplified implementation - in production you'd want more sophisticated queries
    from ..database.models import HazardEvent
    
    total_events = db.query(HazardEvent).count()
    
    # Events by label
    events_by_label = {}
    for event in db.query(HazardEvent).all():
        label_name = event.label_name or f"label_{event.label}"
        events_by_label[label_name] = events_by_label.get(label_name, 0) + 1
    
    # Events in last 24 hours
    from datetime import datetime, timedelta
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
    
    # Top hazard locations (simplified - just count by rounded coordinates)
    top_locations = []
    # This would require more complex aggregation in production
    
    # User counts
    active_users_count = db.query(User).filter(User.is_active == True, User.is_banned == False).count()
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


@app.get(
    "/api/admin/export/csv",
    tags=["Admin"],
    summary="Export hazard events as CSV",
    description="Download all hazard events as CSV file (admin only)."
)
async def export_csv(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Export hazard events as CSV."""
    from ..database.models import HazardEvent
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
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


@app.get(
    "/api/admin/export/pdf",
    tags=["Admin"],
    summary="Export summary report as PDF",
    description="Download summary statistics report as PDF (admin only)."
)
async def export_pdf(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Export summary report as PDF."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    from io import BytesIO
    from fastapi.responses import StreamingResponse
    from ..database.models import HazardEvent
    
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


# ============================================================================
# Prediction Endpoints (Protected)
# ============================================================================
# Prediction Endpoints (Protected)
# ============================================================================


# ============================================================================
# Health Check Endpoint
# ============================================================================

@app.get(
    "/api/health",
    response_model=HealthStatus,
    tags=["Health"],
    summary="API health check",
    description="Returns health status and model loading status"
)
def health_check():
    """Check API and model health.
    
    Returns detailed status of all models and inference readiness.
    """
    loader = model_loader
    status = loader.get_status()
    
    # Check vision pipeline
    try:
        vision_pipeline = get_vision_pipeline()
        vision_ready = vision_pipeline.is_ready()
        vision_status = "loaded" if vision_ready else "not_loaded"
    except Exception as e:
        vision_ready = False
        vision_status = f"error: {str(e)}"
    
    # determine pipeline readiness as stored in app state
    pipeline_ready = getattr(app.state, "inference_pipeline", None) is not None
    
    # Determine overall status
    sensor_loaded = status["stage1_loaded"] and status["stage2_loaded"]
    if sensor_loaded and vision_ready and pipeline_ready:
        overall_status = "ok"
    elif sensor_loaded or vision_ready:
        overall_status = "degraded"
    else:
        overall_status = "error"
    
    return HealthStatus(
        status=overall_status,
        models_loaded=sensor_loaded and vision_ready,
        stage1_model=status["load_details"]["stage1"],
        stage2_model=status["load_details"]["stage2"],
        vision_model=vision_status,
        device=status["device"],
    )


# ============================================================================
# Prediction Endpoint
# ============================================================================

@app.post(
    "/api/predict",
    response_model=PredictionResponse,
    tags=["Inference"],
    summary="Run hazard detection inference",
    description=(
        "Run two-stage cascaded inference on accelerometer data. "
        "Stage 1: classify as Normal vs Hazard. "
        "Stage 2: if hazard, classify as Speedbreaker vs Pothole."
    )
)
def predict(
    request: PredictionRequest,
    current_user: User = Depends(get_current_user)
) -> PredictionResponse:
    """Run inference on accelerometer data.
    
    Args:
        request: PredictionRequest with accelerometer data (100 timesteps × 3 axes)
        
    Returns:
        PredictionResponse with hazard classification and confidence scores
        
    Raises:
        HTTPException 400: If input data is invalid
        HTTPException 503: If models not loaded
        HTTPException 500: If inference fails
    """
    try:
        # Validate input shape
        request.validate_shape()
    except ValueError as e:
        logger.warning(f"Invalid input: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input data: {str(e)}"
        )
    
    # Check models are loaded
    loader = get_model_loader()
    if not loader.is_ready():
        logger.error("Models not loaded, cannot run inference")
        raise HTTPException(
            status_code=503,
            detail="Models not loaded. Service unavailable."
        )
    
    # Run inference using pipeline initialized at startup
    pipeline = getattr(app.state, "inference_pipeline", None)
    if pipeline is None:
        logger.error("Inference pipeline not initialized or models unavailable")
        raise HTTPException(
            status_code=503,
            detail="Models not ready for inference"
        )
    try:
        response = pipeline.predict(request.data)
        logger.info(f"Prediction successful: {response}")
        return response
    except InferenceError as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Inference failed: {str(e)}"
        )


# ============================================================================
# Multimodal Prediction Endpoint
# ============================================================================

@app.post(
    "/api/predict-multimodal",
    response_model=MultimodalPredictionResponse,
    tags=["Inference"],
    summary="Run multimodal sensor-vision fusion inference",
    description=(
        "Run fused inference combining accelerometer sensor data and vision data. "
        "Returns combined hazard detection with confidence scores from both modalities."
    )
)
async def predict_multimodal(
    request: MultimodalPredictionRequest,
    current_user: User = Depends(get_current_user)
) -> MultimodalPredictionResponse:
    """Run multimodal sensor-vision fusion inference.
    
    Args:
        request: MultimodalPredictionRequest with sensor and image data
        
    Returns:
        MultimodalPredictionResponse with fused prediction results
        
    Raises:
        HTTPException 400: If input data is invalid
        HTTPException 503: If models not loaded
        HTTPException 500: If inference fails
    """
    try:
        # Validate sensor input shape
        request.validate_sensor_shape()
    except ValueError as e:
        logger.warning(f"Invalid sensor input: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sensor data: {str(e)}"
        )
    
    # Check models are loaded
    loader = get_model_loader()
    if not loader.is_ready():
        logger.error("Sensor models not loaded, cannot run inference")
        raise HTTPException(
            status_code=503,
            detail="Sensor models not loaded. Service unavailable."
        )
    
    # Check vision pipeline
    try:
        vision_pipeline = get_vision_pipeline()
        if not vision_pipeline.is_ready():
            raise HTTPException(
                status_code=503,
                detail="Vision model not loaded. Service unavailable."
            )
    except Exception as e:
        logger.error(f"Vision pipeline error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Vision pipeline unavailable."
        )
    
    # Run multimodal inference
    pipeline = getattr(app.state, "inference_pipeline", None)
    if pipeline is None:
        logger.error("Inference pipeline not initialized")
        raise HTTPException(
            status_code=503,
            detail="Inference pipeline not ready"
        )
    
    try:
        # Run sensor and vision inference in parallel
        async def run_sensor():
            return await asyncio.get_event_loop().run_in_executor(
                None, pipeline._predict_sensor_internal, request.sensor_data
            )
        
        async def run_vision():
            try:
                return pipeline.vision_pipeline.predict_image(request.image_data)
            except Exception:
                # If vision fails, return default values
                return ("normal", 0.0)
        
        # Execute both in parallel
        sensor_result, vision_result = await asyncio.gather(run_sensor(), run_vision())
        
        # Prepare sensor dict
        sensor_dict = {
            "hazard_detected": sensor_result.hazard_type != 0,
            "hazard_type": sensor_result.hazard_type,
            "confidence": sensor_result.confidence
        }
        
        # Fuse predictions
        fusion_result = pipeline.fusion_pipeline.fuse_predictions(sensor_dict, vision_result)
        
        result = {
            "hazard_detected": fusion_result.hazard_type != 0,
            "hazard_type": fusion_result.hazard_type,
            "final_confidence": fusion_result.confidence,
            "sensor_confidence": fusion_result.sensor_confidence,
            "vision_confidence": fusion_result.vision_confidence,
            "severity_score": fusion_result.confidence
        }
        
        logger.info(f"Multimodal prediction successful: {result}")
        
        # Save event to database
        db = next(get_db())
        try:
            # Check for duplicates before saving
            recent_events = get_all_events(db, include_duplicates=True)
            event_dicts = [{
                "latitude": e.latitude,
                "longitude": e.longitude, 
                "timestamp": e.timestamp.isoformat()
            } for e in recent_events]
            
            is_dup = is_duplicate(
                request.latitude, request.longitude, request.timestamp,
                event_dicts
            )
            
            event_data = {
                "timestamp": request.timestamp,
                "latitude": request.latitude,
                "longitude": request.longitude,
                "label": result["hazard_type"],
                "label_name": "normal" if result["hazard_type"] == 0 else ("speedbreaker" if result["hazard_type"] == 1 else "pothole"),
                "p_sensor": result["sensor_confidence"],
                "p_vision": result["vision_confidence"],
                "p_final": result["final_confidence"],
                "confidence": result["final_confidence"],
                "is_duplicate": is_dup
            }
            save_event(db, event_data)
            logger.info(f"Event saved to database (duplicate: {is_dup})")
        except Exception as db_e:
            logger.error(f"Failed to save event to database: {db_e}")
        finally:
            db.close()
        
        return MultimodalPredictionResponse(**result)
    except InferenceError as e:
        logger.error(f"Multimodal inference error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Multimodal inference failed: {str(e)}"
        )


# ============================================================================
# Batch Prediction Endpoint
# ============================================================================

@app.post(
    "/api/predict-batch",
    response_model=BatchPredictionResponse,
    tags=["Inference"],
    summary="Run batch inference on multiple samples",
    description=(
        "Process multiple samples in a single request. "
        "Supports both sensor-only and multimodal batch processing."
    )
)
def predict_batch(
    request: BatchPredictionRequest,
    current_user: User = Depends(get_current_user)
) -> BatchPredictionResponse:
    """Run batch inference on multiple samples.
    
    Args:
        request: BatchPredictionRequest with sensor_batch and optional image_batch
        
    Returns:
        BatchPredictionResponse with predictions for each sample
        
    Raises:
        HTTPException 400: If input data is invalid
        HTTPException 503: If models not loaded
        HTTPException 500: If inference fails
    """
    # Validate batch size
    if len(request.sensor_batch) == 0:
        raise HTTPException(
            status_code=400,
            detail="Sensor batch cannot be empty"
        )
    
    if request.image_batch and len(request.image_batch) != len(request.sensor_batch):
        raise HTTPException(
            status_code=400,
            detail="Image batch length must match sensor batch length"
        )
    
    # Validate each sensor sample
    for i, sensor_data in enumerate(request.sensor_batch):
        try:
            if len(sensor_data) != 100:
                raise ValueError(f"Sample {i}: Expected 100 timesteps, got {len(sensor_data)}")
            for j, timestep in enumerate(sensor_data):
                if len(timestep) != 3:
                    raise ValueError(f"Sample {i}, timestep {j}: Expected 3 axes, got {len(timestep)}")
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid sensor data in batch: {str(e)}"
            )
    
    # Check models are loaded for sensor inference
    loader = get_model_loader()
    if not loader.is_ready():
        logger.error("Sensor models not loaded, cannot run batch inference")
        raise HTTPException(
            status_code=503,
            detail="Sensor models not loaded. Service unavailable."
        )
    
    # Check vision if images provided
    if request.image_batch:
        try:
            vision_pipeline = get_vision_pipeline()
            if not vision_pipeline.is_ready():
                raise HTTPException(
                    status_code=503,
                    detail="Vision model not loaded. Service unavailable."
                )
        except Exception as e:
            logger.error(f"Vision pipeline error: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail="Vision pipeline unavailable."
            )
    
    # Run batch inference
    pipeline = getattr(app.state, "inference_pipeline", None)
    if pipeline is None:
        logger.error("Inference pipeline not initialized")
        raise HTTPException(
            status_code=503,
            detail="Inference pipeline not ready"
        )
    
    try:
        predictions = pipeline.predict_batch(request.sensor_batch, request.image_batch)
        logger.info(f"Batch prediction successful: {len(predictions)} samples")
        return BatchPredictionResponse(predictions=predictions)
    except InferenceError as e:
        logger.error(f"Batch inference error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch inference failed: {str(e)}"
        )


# ============================================================================
# Events Endpoints
# ============================================================================

@app.get(
    "/api/events",
    tags=["Events"],
    summary="Get all hazard events",
    description="Retrieve all stored hazard detection events"
)
def get_events(include_duplicates: bool = False):
    """Get all hazard events from database."""
    db = next(get_db())
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
                "is_duplicate": event.is_duplicate
            })
        return {"events": event_list}
    finally:
        db.close()


@app.get(
    "/api/events/{label}",
    tags=["Events"],
    summary="Get events by hazard type",
    description="Retrieve hazard events filtered by label (0=Normal, 1=SpeedBreaker, 2=Pothole)"
)
def get_events_by_type(label: int, include_duplicates: bool = False):
    """Get hazard events filtered by label."""
    if label not in [0, 1, 2]:
        raise HTTPException(
            status_code=400,
            detail="Label must be 0 (Normal), 1 (SpeedBreaker), or 2 (Pothole)"
        )
    
    db = next(get_db())
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
    finally:
        db.close()


# ============================================================================
# Metadata Endpoints (Optional - for debugging)
# ============================================================================

@app.get(
    "/api/info",
    tags=["Info"],
    summary="API information",
    description="Returns API metadata and configuration"
)
def api_info():
    """Get API information."""
    return {
        "title": API_TITLE,
        "version": API_VERSION,
        "description": API_DESCRIPTION,
        "device": DEVICE,
        "endpoints": {
            "health": "/api/health (GET)",
            "predict": "/api/predict (POST)",
            "docs": "/docs (interactive API documentation)",
            "redoc": "/redoc (alternative documentation)",
        }
    }


# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/", tags=["Root"])
def root():
    """Root endpoint - redirects to API documentation."""
    return {
        "message": "RoadHazardProject API",
        "docs": "Visit /docs for interactive API documentation",
        "version": API_VERSION,
    }


# ============================================================================
# Hazard Reporting (User Submissions)
# ============================================================================

@app.post(
    "/api/hazards/report",
    tags=["Reporting"],
    summary="Report a hazard via image upload",
    description="Users can report a detected hazard with an image and location"
)
async def report_hazard(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: str = Form(default="Road hazard detected"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a hazard report with image."""
    try:
        import os
        import uuid
        
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
        
        logger.info(f"Hazard report {report.id} submitted by user {current_user.username} at ({latitude}, {longitude})")
        
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


@app.get(
    "/api/admin/reports",
    tags=["Admin"],
    summary="Get all hazard reports",
    description="Get list of all user-submitted hazard reports (admin only)"
)
async def get_hazard_reports(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get hazard reports, optionally filtered by status."""
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


@app.put(
    "/api/admin/reports/{report_id}/status",
    tags=["Admin"],
    summary="Update report status",
    description="Update the status of a hazard report (admin only)"
)
async def update_report_status(
    report_id: int,
    status: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update hazard report status."""
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


# ============================================================================
# Startup Test
# ============================================================================

if __name__ == "__main__":
    # For debugging: run with `python -m app.backend.main`
    import uvicorn
    
    logger.info("Starting server via __main__...")
    uvicorn.run(
        "app.backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=LOG_LEVEL.lower(),
    )
