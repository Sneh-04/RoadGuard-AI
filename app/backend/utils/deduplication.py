"""Spatial-temporal deduplication for hazard events."""
import math
from typing import List, Dict, Any
from datetime import datetime


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate haversine distance between two GPS coordinates in meters."""
    # Convert to radians
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    # Earth's radius in meters
    R = 6371000
    return R * c


def is_duplicate(new_lat: float, new_lon: float, new_timestamp: str, 
                existing_events: List[Dict[str, Any]], 
                radius_m: float = 50.0, window_sec: float = 60.0) -> bool:
    """Check if new event is a duplicate of existing events.
    
    Args:
        new_lat: Latitude of new event
        new_lon: Longitude of new event  
        new_timestamp: ISO timestamp string of new event
        existing_events: List of existing event dicts
        radius_m: Spatial radius in meters
        window_sec: Temporal window in seconds
        
    Returns:
        True if duplicate found, False otherwise
    """
    try:
        # Parse new timestamp
        new_time = datetime.fromisoformat(new_timestamp.replace('Z', '+00:00'))
    except ValueError:
        # If parsing fails, assume not duplicate
        return False
    
    for event in existing_events:
        try:
            # Check spatial distance
            distance = haversine_distance(new_lat, new_lon, 
                                        event['latitude'], event['longitude'])
            
            if distance > radius_m:
                continue
            
            # Check temporal distance
            event_time = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))
            time_diff = abs((new_time - event_time).total_seconds())
            
            if time_diff <= window_sec:
                return True
                
        except (KeyError, ValueError, TypeError):
            # Skip malformed events
            continue
    
    return False