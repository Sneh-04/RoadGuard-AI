from datetime import datetime
"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class HazardType(Enum):
    """Hazard type enumeration."""
    NORMAL = 0
    SPEEDBREAKER = 1
    POTHOLE = 2


class PredictionResponse(BaseModel):
    """Response from /predict endpoint."""
    hazard_detected: bool = Field(
        ...,
        description="Whether a hazard was detected (Stage 1 > 0.5)"
    )
    hazard_type: HazardType = Field(
        ...,
        description="Hazard type (0=Normal, 1=SpeedBreaker, 2=Pothole)"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Stage 1 confidence score (0.0-1.0)"
    )
    stage2_confidence: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Stage 2 confidence score if hazard detected (0.0-1.0)"
    )
    severity_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Overall severity score (0.0-1.0)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "hazard_detected": True,
                "hazard_type": 2,
                "confidence": 0.85,
                "stage2_confidence": 0.78,
                "severity_score": 0.82
            }
        }


class PredictionRequest(BaseModel):
    """Request body for /predict endpoint.
    
    Expects accelerometer data in shape (100, 3):
    - 100 timesteps  
    - 3 axes (X, Y, Z acceleration in m/s²)
    """
    data: list[list[float]] = Field(
        ...,
        description="Accelerometer data: 100 timesteps × 3 axes (X, Y, Z in m/s²)",
        example=[[0.1, 0.2, 0.3], [0.15, 0.25, 0.35]]
    )

    class Config:
        json_schema_extra = {
            "example": {
                "data": [[0.1, 0.2, 0.3] for _ in range(100)]
            }
        }

    def validate_shape(self):
        """Validate input has correct shape (100, 3)."""
        if len(self.data) != 100:
            raise ValueError(
                f"Expected 100 timesteps, got {len(self.data)}"
            )
        for i, timestep in enumerate(self.data):
            if len(timestep) != 3:
                raise ValueError(
                    f"Expected 3 axes at timestep {i}, got {len(timestep)}"
                )
            for j, val in enumerate(timestep):
                if not isinstance(val, (int, float)):
                    raise ValueError(
                        f"Expected numeric value at [{i}][{j}], got {type(val).__name__}"
                    )


class MultimodalPredictionRequest(BaseModel):
    """Request body for /predict-multimodal endpoint.
    
    Expects both accelerometer data and image data.
    """
    sensor_data: list[list[float]] = Field(
        ...,
        description="Accelerometer data: 100 timesteps × 3 axes (X, Y, Z in m/s²)",
        example=[[0.1, 0.2, 0.3], [0.15, 0.25, 0.35]]
    )
    image_data: bytes = Field(
        ...,
        description="Image data as raw bytes (JPEG/PNG)",
        example=b"..."  # Would be actual image bytes
    )
    latitude: float = Field(
        ...,
        description="GPS latitude",
        example=12.9716
    )
    longitude: float = Field(
        ...,
        description="GPS longitude", 
        example=77.5946
    )
    timestamp: str = Field(
        ...,
        description="ISO timestamp string",
        example="2024-03-16T10:30:00Z"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "sensor_data": [[0.1, 0.2, 0.3] for _ in range(100)],
                "image_data": "base64_encoded_image_data_here",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "timestamp": "2024-03-16T10:30:00Z"
            }
        }

    def validate_sensor_shape(self):
        """Validate sensor input has correct shape (100, 3)."""
        if len(self.sensor_data) != 100:
            raise ValueError(
                f"Expected 100 timesteps, got {len(self.sensor_data)}"
            )
        for i, timestep in enumerate(self.sensor_data):
            if len(timestep) != 3:
                raise ValueError(
                    f"Expected 3 axes at timestep {i}, got {len(timestep)}"
                )
            for j, val in enumerate(timestep):
                if not isinstance(val, (int, float)):
                    raise ValueError(
                        f"Expected numeric value at [{i}][{j}], got {type(val).__name__}"
                    )


class MultimodalPredictionResponse(BaseModel):
    """Response from /predict-multimodal endpoint."""
    hazard_detected: bool = Field(
        ...,
        description="Whether a hazard was detected by fusion"
    )
    hazard_type: HazardType = Field(
        ...,
        description="Final hazard type from fusion (0=normal, 1=speedbreaker, 2=pothole)"
    )
    final_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Fused confidence score (0.0-1.0)"
    )
    sensor_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence from sensor modality (0.0-1.0)"
    )
    vision_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence from vision modality (0.0-1.0)"
    )
    severity_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Overall severity score (0.0-1.0)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "hazard_detected": True,
                "hazard_type": 2,
                "final_confidence": 0.85,
                "sensor_confidence": 0.82,
                "vision_confidence": 0.88,
                "severity_score": 0.85
            }
        }


class BatchPredictionRequest(BaseModel):
    """Request body for /predict-batch endpoint.
    
    Supports both sensor-only and multimodal batch processing.
    """
    sensor_batch: list[list[list[float]]] = Field(
        ...,
        description="List of accelerometer data samples",
        example=[[[0.1, 0.2, 0.3] for _ in range(100)], [[0.15, 0.25, 0.35] for _ in range(100)]]
    )
    image_batch: Optional[list[bytes]] = Field(
        default=None,
        description="Optional list of image data (same length as sensor_batch)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "sensor_batch": [
                    [[0.1, 0.2, 0.3] for _ in range(100)],
                    [[0.15, 0.25, 0.35] for _ in range(100)]
                ],
                "image_batch": ["base64_image_1", "base64_image_2"]
            }
        }


class BatchPredictionResponse(BaseModel):
    """Response from /predict-batch endpoint."""
    predictions: list[dict] = Field(
        ...,
        description="List of prediction results for each sample"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "predictions": [
                    {
                        "hazard_detected": True,
                        "hazard_type": "pothole",
                        "final_confidence": 0.85,
                        "sensor_confidence": 0.82,
                        "vision_confidence": 0.88,
                        "severity_score": 0.85
                    },
                    {
                        "hazard_detected": False,
                        "hazard_type": "normal",
                        "final_confidence": 0.92,
                        "sensor_confidence": 0.92,
                        "vision_confidence": None,
                        "severity_score": 0.08
                    }
                ]
            }
        }


class HealthStatus(BaseModel):
    """Response from /health endpoint."""
    status: str = Field(
        ...,
        description="Overall health status (ok/degraded/error)"
    )
    models_loaded: bool = Field(
        ...,
        description="Whether all required models are loaded"
    )
    stage1_model: str = Field(
        ...,
        description="Stage 1 model loading status"
    )
    stage2_model: str = Field(
        ...,
        description="Stage 2 model loading status"
    )
    vision_model: str = Field(
        ...,
        description="Vision model loading status"
    )
    device: str = Field(
        ...,
        description="Inference device (cpu/gpu)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "status": "ok",
                "models_loaded": True,
                "stage1_model": "loaded",
                "stage2_model": "loaded",
                "vision_model": "loaded",
                "device": "cpu"
            }
        }


# ============================================================================
# Authentication Schemas
# ============================================================================

class UserSignupRequest(BaseModel):
    """Request body for user signup."""
    email: str = Field(..., description="User email address")
    username: str = Field(..., description="Unique username")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    role: str = Field(default="user", description="User role: 'user' or 'admin'")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "username": "johndoe",
                "password": "securepassword",
                "role": "user"
            }
        }


class UserLoginRequest(BaseModel):
    """Request body for user login."""
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword"
            }
        }


class TokenResponse(BaseModel):
    """Response containing JWT token."""
    token: str = Field(..., description="JWT access token")
    user_id: int = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    role: str = Field(..., description="User role")

    class Config:
        json_schema_extra = {
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "user_id": 1,
                "username": "johndoe",
                "role": "user"
            }
        }


class UserProfileResponse(BaseModel):
    """User profile response."""
    id: int
    email: str
    username: str
    role: str
    is_active: bool
    is_banned: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "username": "johndoe",
                "role": "user",
                "is_active": True,
                "is_banned": False,
                "created_at": "2024-01-01T00:00:00Z",
                "last_login": "2024-01-01T12:00:00Z"
            }
        }


class UserListResponse(BaseModel):
    """Response for user list."""
    users: list[UserProfileResponse]
    total_count: int

    class Config:
        json_schema_extra = {
            "example": {
                "users": [
                    {
                        "id": 1,
                        "email": "user@example.com",
                        "username": "johndoe",
                        "role": "user",
                        "is_active": True,
                        "is_banned": False,
                        "created_at": "2024-01-01T00:00:00Z",
                        "last_login": "2024-01-01T12:00:00Z"
                    }
                ],
                "total_count": 1
            }
        }


class AdminStatsResponse(BaseModel):
    """Admin statistics response."""
    total_events: int
    events_by_label: dict
    events_last_24h: int
    events_by_hour: list[dict]  # For chart data
    top_hazard_locations: list[dict]
    active_users_count: int
    total_users_count: int

    class Config:
        json_schema_extra = {
            "example": {
                "total_events": 1250,
                "events_by_label": {"normal": 800, "speed_breaker": 300, "pothole": 150},
                "events_last_24h": 45,
                "events_by_hour": [{"hour": "14", "count": 12}],
                "top_hazard_locations": [{"lat": 12.9716, "lon": 77.5946, "count": 25}],
                "active_users_count": 15,
                "total_users_count": 20
            }
        }
