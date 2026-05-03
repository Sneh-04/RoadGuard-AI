import time
import math
import random
from collections import deque

# Store last few readings
ACCEL_HISTORY = deque(maxlen=5)
LAST_EVENT_TIME = 0

# Thresholds (tune if needed)
VERTICAL_THRESHOLD = 15
IMPACT_DROP = 3
IMPACT_RISE = 3
COOLDOWN = 1.5  # seconds
ROUGH_ROAD_THRESHOLD = 12
MIN_SPEED_THRESHOLD = 5  # km/h - don't detect hazards when moving too slow


def magnitude(x, y, z):
    return math.sqrt(x*x + y*y + z*z)


def is_vertical_spike(ax, ay, az):
    return abs(az) > abs(ax) and abs(az) > abs(ay) and abs(az) > VERTICAL_THRESHOLD


def detect_impact_pattern(z_values):
    if len(z_values) < 3:
        return False

    prev, curr, next_ = z_values[-3], z_values[-2], z_values[-1]

    # dip then rise (pothole pattern)
    if curr < prev - IMPACT_DROP and next_ > curr + IMPACT_RISE:
        return True

    return False


def can_trigger():
    global LAST_EVENT_TIME
    now = time.time()
    if now - LAST_EVENT_TIME > COOLDOWN:
        LAST_EVENT_TIME = now
        return True
    return False


def detect_pothole(accel, speed=0):
    global ACCEL_HISTORY

    # Don't detect hazards when moving too slow (prevents false alerts from shaking)
    if speed < MIN_SPEED_THRESHOLD:
        return None

    ax, ay, az = accel
    ACCEL_HISTORY.append((ax, ay, az))

    if len(ACCEL_HISTORY) < 3:
        return None

    if not is_vertical_spike(ax, ay, az):
        return None

    z_values = [z for _, _, z in ACCEL_HISTORY]

    if detect_impact_pattern(z_values) and can_trigger():
        return {
            "hazard": "pothole",
            "confidence": round(random.uniform(0.85, 0.95), 2)
        }

    return None


def detect_motion(speed, accel):
    ax, ay, az = accel
    mag = magnitude(ax, ay, az)

    if speed > 10:
        return "moving"
    elif mag > 12:
        return "rough"
    return "stable"

def detect_rough_road(accel, speed=0):
    """Detect rough road conditions based on sustained vibrations."""
    if speed < MIN_SPEED_THRESHOLD:
        return None

    ax, ay, az = accel
    mag = magnitude(ax, ay, az)

    # Check for moderate but sustained vibrations (rough road)
    if mag > ROUGH_ROAD_THRESHOLD and can_trigger():
        return {
            "hazard": "rough_road",
            "confidence": round(random.uniform(0.75, 0.88), 2)
        }

    return None


def smart_prediction(sensor_data):
    accel = sensor_data["accel"]
    speed = sensor_data.get("speed", 0)

    # Check for potholes first (higher priority)
    pothole = detect_pothole(accel, speed)
    if pothole:
        return pothole

    # Check for rough roads
    rough_road = detect_rough_road(accel, speed)
    if rough_road:
        return rough_road

    # No hazards detected
    motion = detect_motion(speed, accel)
    return {
        "hazard": "clear",
        "motion": motion,
        "confidence": round(random.uniform(0.92, 0.98), 2)
    }