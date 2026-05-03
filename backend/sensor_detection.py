import math
import random
import time

GRAVITY = 9.8
MIN_SPEED = 5          # km/h → ignore noise when slow
POTHOLE_IMPACT = 18    # strong spike
SPEED_BUMP_RANGE = (13, 18)
ROUGH_THRESHOLD = 11   # continuous vibration
COOLDOWN = 1.5         # seconds

last_event_time = 0


def magnitude(accel):
    x, y, z = accel
    return math.sqrt(x*x + y*y + z*z)


def smart_prediction(data):
    global last_event_time

    accel = data.get("accel", [0, 0, GRAVITY])
    speed = data.get("speed", 0)

    mag = magnitude(accel)
    vertical_spike = abs(mag - GRAVITY)
    now = time.time()

    # 🚫 Ignore if too slow
    if speed < MIN_SPEED:
        return {"hazard": "clear", "confidence": 0.95}

    # 🚫 Cooldown (avoid spam)
    if now - last_event_time < COOLDOWN:
        return {"hazard": "clear", "confidence": 0.90}

    # 🚨 POTHOLE → sharp spike
    if vertical_spike > POTHOLE_IMPACT:
        last_event_time = now
        return {
            "hazard": "pothole",
            "confidence": round(random.uniform(0.88, 0.96), 2)
        }

    # 🚧 SPEED BUMP → medium spike (smooth up/down)
    if SPEED_BUMP_RANGE[0] < vertical_spike <= SPEED_BUMP_RANGE[1]:
        last_event_time = now
        return {
            "hazard": "speed_bump",
            "confidence": round(random.uniform(0.80, 0.90), 2)
        }

    # ⚠️ ROUGH ROAD → continuous vibration
    if vertical_spike > ROUGH_THRESHOLD:
        return {
            "hazard": "rough_road",
            "confidence": round(random.uniform(0.75, 0.85), 2)
        }

    return {
        "hazard": "clear",
        "confidence": round(random.uniform(0.92, 0.98), 2)
    }