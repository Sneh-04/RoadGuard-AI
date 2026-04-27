"""
Synthetic Hazard Image Generator for RoadGuard Models
Generates synthetic road images for vision model testing
"""

import os
import random
from PIL import Image, ImageDraw, ImageFilter
import numpy as np


class SyntheticImageGenerator:
    """Generates synthetic hazard images"""
    
    def __init__(self, width=640, height=480, output_dir='synthetic_images'):
        self.width = width
        self.height = height
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def create_road_background(self):
        """Create realistic road background"""
        img = Image.new('RGB', (self.width, self.height), color=(50, 50, 50))
        pixels = img.load()
        
        # Add road texture variation
        for i in range(self.width):
            for j in range(self.height):
                noise = random.randint(-10, 10)
                r = max(0, min(255, 50 + noise))
                g = max(0, min(255, 50 + noise))
                b = max(0, min(255, 50 + noise))
                pixels[i, j] = (r, g, b)
        
        # Add road markings (yellow lines)
        draw = ImageDraw.Draw(img)
        for y in range(0, self.height, 80):
            draw.line([(0, y), (self.width, y)], fill=(200, 200, 0), width=3)
        
        return img
    
    def generate_normal_road(self, count=30):
        """Generate normal road images"""
        print(f"🛣️  Generating {count} normal road images...")
        for i in range(count):
            img = self.create_road_background()
            
            # Add slight perspective
            img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
            
            filename = f"{self.output_dir}/normal_road_{i:03d}.jpg"
            img.save(filename, 'JPEG', quality=90)
        
        print(f"✅ Generated {count} normal road images")
        return count
    
    def generate_pothole(self, count=30):
        """Generate pothole images"""
        print(f"🕳️  Generating {count} pothole images...")
        for i in range(count):
            img = self.create_road_background()
            draw = ImageDraw.Draw(img)
            
            # Generate pothole (dark irregular shape)
            pothole_x = random.randint(150, 450)
            pothole_y = random.randint(150, 350)
            pothole_size = random.randint(40, 120)
            
            # Draw pothole as dark irregular circle
            shadow_color = (20, 20, 20)
            for offset in range(3):
                draw.ellipse(
                    [pothole_x - pothole_size//2 + offset,
                     pothole_y - pothole_size//2 + offset,
                     pothole_x + pothole_size//2 + offset,
                     pothole_y + pothole_size//2 + offset],
                    fill=shadow_color
                )
            
            # Add edge highlights (lighter)
            highlight_color = (100, 100, 100)
            draw.arc(
                [pothole_x - pothole_size//2,
                 pothole_y - pothole_size//2,
                 pothole_x + pothole_size//2,
                 pothole_y + pothole_size//2],
                start=0, end=180,
                fill=highlight_color, width=3
            )
            
            # Blur for realistic effect
            img = img.filter(ImageFilter.GaussianBlur(radius=1))
            
            filename = f"{self.output_dir}/pothole_{i:03d}.jpg"
            img.save(filename, 'JPEG', quality=90)
        
        print(f"✅ Generated {count} pothole images")
        return count
    
    def generate_speed_bump(self, count=30):
        """Generate speed bump images"""
        print(f"🚗 Generating {count} speed bump images...")
        for i in range(count):
            img = self.create_road_background()
            draw = ImageDraw.Draw(img)
            
            # Draw speed bump (horizontal stripe)
            bump_y = random.randint(200, 300)
            bump_height = random.randint(20, 40)
            bump_color = (60, 60, 60)
            
            # Main bump
            draw.rectangle(
                [50, bump_y, self.width - 50, bump_y + bump_height],
                fill=bump_color
            )
            
            # Add stripes (yellow/black pattern)
            stripe_width = 30
            for x in range(50, self.width - 50, stripe_width * 2):
                draw.rectangle(
                    [x, bump_y, x + stripe_width, bump_y + bump_height],
                    fill=(200, 200, 0)
                )
            
            # Add 3D effect with shadow
            draw.rectangle(
                [50, bump_y + bump_height, self.width - 50, bump_y + bump_height + 5],
                fill=(30, 30, 30)
            )
            
            # Slight blur
            img = img.filter(ImageFilter.GaussianBlur(radius=0.8))
            
            filename = f"{self.output_dir}/speed_bump_{i:03d}.jpg"
            img.save(filename, 'JPEG', quality=90)
        
        print(f"✅ Generated {count} speed bump images")
        return count
    
    def generate_dataset(self):
        """Generate complete synthetic image dataset"""
        print("🎨 Generating synthetic hazard images...\n")
        
        normal_count = self.generate_normal_road(30)
        pothole_count = self.generate_pothole(30)
        speedbump_count = self.generate_speed_bump(30)
        
        total = normal_count + pothole_count + speedbump_count
        
        print(f"\n✨ Dataset Summary:")
        print(f"   📁 Output directory: {os.path.abspath(self.output_dir)}")
        print(f"   📊 Total images: {total}")
        print(f"   🛣️  Normal roads: {normal_count}")
        print(f"   🕳️  Potholes: {pothole_count}")
        print(f"   🚗 Speed bumps: {speedbump_count}")
        print(f"\n✅ Synthetic images ready for model testing!")
        
        return {
            "output_dir": self.output_dir,
            "normal": normal_count,
            "pothole": pothole_count,
            "speed_bump": speedbump_count,
            "total": total
        }


if __name__ == "__main__":
    generator = SyntheticImageGenerator()
    stats = generator.generate_dataset()
