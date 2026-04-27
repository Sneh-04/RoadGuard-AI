"""
Synthetic Data Generator for RoadGuard Models
Generates realistic sensor and image data to demonstrate model performance
"""

import json
import random
import numpy as np
from datetime import datetime, timedelta
import os

class SyntheticSensorDataGenerator:
    """Generates realistic sensor data for hazard detection"""
    
    def __init__(self, seed=42):
        random.seed(seed)
        np.random.seed(seed)
        
        # Chennai coordinates (reference points)
        self.locations = [
            {"lat": 13.0827, "lng": 80.2707, "name": "Marina Beach"},
            {"lat": 13.1939, "lng": 80.1829, "name": "Velachery"},
            {"lat": 13.0427, "lng": 80.2279, "name": "Besant Nagar"},
            {"lat": 13.1667, "lng": 80.2167, "name": "Mylapore"},
            {"lat": 13.0649, "lng": 80.2372, "name": "T. Nagar"},
        ]
    
    def generate_normal_road(self, count=100):
        """Generate sensor readings for normal road conditions"""
        data = []
        for i in range(count):
            reading = {
                "id": f"normal_{i:04d}",
                "label": 0,  # Normal road
                "timestamp": (datetime.now() - timedelta(seconds=random.randint(0, 3600))).isoformat(),
                "location": random.choice(self.locations),
                "vibration": np.random.uniform(0.1, 0.5),  # Low vibration
                "accelerationX": np.random.uniform(-2, 2),
                "accelerationY": np.random.uniform(-2, 2),
                "accelerationZ": np.random.uniform(9, 11),  # ~9.8 m/s²
                "cameraConfidence": random.randint(80, 95),
                "speed": random.uniform(40, 60),  # km/h
            }
            data.append(reading)
        return data
    
    def generate_pothole(self, count=80):
        """Generate sensor readings for pothole hazards"""
        data = []
        for i in range(count):
            reading = {
                "id": f"pothole_{i:04d}",
                "label": 2,  # Pothole
                "timestamp": (datetime.now() - timedelta(seconds=random.randint(0, 3600))).isoformat(),
                "location": random.choice(self.locations),
                "vibration": np.random.uniform(0.75, 0.95),  # High vibration
                "accelerationX": np.random.uniform(-8, 8),  # High acceleration
                "accelerationY": np.random.uniform(-8, 8),
                "accelerationZ": np.random.uniform(5, 14),  # High Z variation
                "cameraConfidence": random.randint(70, 90),
                "speed": random.uniform(20, 40),  # Lower speed on hazard
            }
            data.append(reading)
        return data
    
    def generate_speed_bump(self, count=70):
        """Generate sensor readings for speed bump hazards"""
        data = []
        for i in range(count):
            reading = {
                "id": f"speedbump_{i:04d}",
                "label": 1,  # Speed bump
                "timestamp": (datetime.now() - timedelta(seconds=random.randint(0, 3600))).isoformat(),
                "location": random.choice(self.locations),
                "vibration": np.random.uniform(0.65, 0.80),  # Medium-high vibration
                "accelerationX": np.random.uniform(-5, 5),
                "accelerationY": np.random.uniform(-5, 5),
                "accelerationZ": np.random.uniform(7, 12),  # Medium Z variation
                "cameraConfidence": random.randint(65, 85),
                "speed": random.uniform(15, 35),  # Slower speed
            }
            data.append(reading)
        return data
    
    def generate_dataset(self, output_file='synthetic_sensor_data.json'):
        """Generate complete balanced dataset"""
        print("🔄 Generating synthetic sensor data...")
        
        dataset = {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "total_samples": 250,
                "classes": {
                    "0": "Normal Road (100 samples)",
                    "1": "Speed Bump (70 samples)",
                    "2": "Pothole (80 samples)"
                },
                "features": ["vibration", "accelerationX", "accelerationY", "accelerationZ", "cameraConfidence", "speed", "location"],
            },
            "data": []
        }
        
        # Generate all classes
        dataset["data"].extend(self.generate_normal_road(100))
        dataset["data"].extend(self.generate_speed_bump(70))
        dataset["data"].extend(self.generate_pothole(80))
        
        # Shuffle
        random.shuffle(dataset["data"])
        
        # Save to file
        with open(output_file, 'w') as f:
            json.dump(dataset, f, indent=2)
        
        print(f"✅ Generated {len(dataset['data'])} sensor samples → {output_file}")
        print(f"   📊 Normal Roads: 100")
        print(f"   🚗 Speed Bumps: 70")
        print(f"   🕳️  Potholes: 80")
        
        return dataset


if __name__ == "__main__":
    generator = SyntheticSensorDataGenerator()
    dataset = generator.generate_dataset()
    
    # Show statistics
    print("\n📈 Dataset Statistics:")
    normal = len([d for d in dataset["data"] if d["label"] == 0])
    speedbump = len([d for d in dataset["data"] if d["label"] == 1])
    pothole = len([d for d in dataset["data"] if d["label"] == 2])
    
    print(f"   Total samples: {len(dataset['data'])}")
    print(f"   Class distribution: 0={normal}, 1={speedbump}, 2={pothole}")
    
    # Show sample
    print("\n📋 Sample Reading:")
    print(json.dumps(dataset["data"][0], indent=2))
