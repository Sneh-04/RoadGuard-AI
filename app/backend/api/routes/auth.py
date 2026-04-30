"""Authentication routes - user signup, login, and profile management."""
import logging
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from ...database.db import get_db
from ...database.models import User
from ...utils.schemas import (
    UserSignupRequest,
    UserLoginRequest,
    TokenResponse,
    UserProfileResponse,
)
from ..security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=TokenResponse,
    summary="User signup",
    description="Create a new user account and return authentication token.",
)
async def signup(
    request: UserSignupRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Create a new user account.
    
    Args:
        request: UserSignupRequest with email, username, password, and role
        db: Database session
        
    Returns:
        TokenResponse with JWT token and user info
        
    Raises:
        HTTPException: If email/username already exists or invalid role
    """
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
    token = create_access_token({
        "sub": str(user.id),
        "username": user.username,
        "role": user.role
    })
    
    logger.info(f"New user registered: {user.username} ({user.role})")
    
    return TokenResponse(
        token=token,
        user_id=user.id,
        username=user.username,
        role=user.role
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login",
    description="Authenticate user and return JWT token.",
)
async def login(
    request: UserLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate user with email and password.
    
    Args:
        request: UserLoginRequest with email and password
        db: Database session
        
    Returns:
        TokenResponse with JWT token and user info
        
    Raises:
        HTTPException: If credentials invalid or account inactive/banned
    """
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
    token = create_access_token({
        "sub": str(user.id),
        "username": user.username,
        "role": user.role
    })
    
    logger.info(f"User logged in: {user.username}")
    
    return TokenResponse(
        token=token,
        user_id=user.id,
        username=user.username,
        role=user.role
    )


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get current user profile",
    description="Get profile information for the currently authenticated user.",
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserProfileResponse:
    """Get current user profile.
    
    Args:
        current_user: Authenticated user from JWT token
        
    Returns:
        UserProfileResponse with user details
    """
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
