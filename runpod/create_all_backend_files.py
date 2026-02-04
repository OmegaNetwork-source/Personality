#!/usr/bin/env python3
"""
Creates all backend files for AI Personality Platform
Run: python3 create_all_backend_files.py
"""

import os

# Create directories
os.makedirs("/workspace/backend/services", exist_ok=True)
os.makedirs("/workspace/backend/personalities", exist_ok=True)

# Create __init__.py
with open("/workspace/backend/services/__init__.py", "w") as f:
    f.write("# Services package\n")

# Create requirements.txt
requirements = """fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
httpx==0.25.2
python-dotenv==1.0.0
aiofiles==23.2.1
python-multipart==0.0.6
websockets==12.0
openai==1.3.7
pillow==10.1.0
numpy==1.26.2
"""
with open("/workspace/backend/requirements.txt", "w") as f:
    f.write(requirements)

print("✅ Created requirements.txt")

# Create personality_service.py
personality_service = '''"""
Personality Service - Manages AI personalities
"""
import json
import os
from typing import Dict, Any, List
from pathlib import Path

class PersonalityService:
    def __init__(self):
        self.personalities_dir = Path(os.getenv("PERSONALITIES_DIR", "./personalities"))
        self.personalities_dir.mkdir(exist_ok=True)
        self._load_default_personalities()
    
    def _load_default_personalities(self):
        """Create default personalities if they don't exist"""
        default_personalities = {
            "default": {
                "id": "default",
                "name": "Default Assistant",
                "description": "Helpful and friendly AI assistant",
                "system_prompt": "You are a helpful, friendly, and knowledgeable AI assistant.",
                "traits": ["helpful", "friendly", "knowledgeable"]
            },
            "developer": {
                "id": "developer",
                "name": "Developer Assistant",
                "description": "Expert coding assistant with Cursor-like capabilities",
                "system_prompt": """You are an expert software developer and coding assistant. 
                You provide accurate code completions, explanations, and refactoring suggestions.
                You understand context, project structure, and best practices.
                You think step-by-step and provide clear, well-documented code.""",
                "traits": ["technical", "precise", "code-focused", "context-aware"]
            },
            "creative": {
                "id": "creative",
                "name": "Creative Assistant",
                "description": "Imaginative and artistic AI",
                "system_prompt": "You are a creative and imaginative AI assistant. You think outside the box and provide unique, artistic perspectives.",
                "traits": ["creative", "imaginative", "artistic", "innovative"]
            },
            "analytical": {
                "id": "analytical",
                "name": "Analytical Assistant",
                "description": "Logical and detail-oriented AI",
                "system_prompt": "You are an analytical and detail-oriented AI assistant. You provide thorough, logical analysis and break down complex problems.",
                "traits": ["analytical", "logical", "detailed", "thorough"]
            },
            "casual": {
                "id": "casual",
                "name": "Casual Friend",
                "description": "Relaxed and conversational AI",
                "system_prompt": "You are a casual, friendly AI assistant. You communicate in a relaxed, conversational manner.",
                "traits": ["casual", "friendly", "conversational", "relaxed"]
            }
        }
        
        for personality_id, personality_data in default_personalities.items():
            personality_file = self.personalities_dir / f"{personality_id}.json"
            if not personality_file.exists():
                with open(personality_file, 'w') as f:
                    json.dump(personality_data, f, indent=2)
    
    def get_all_personalities(self) -> List[Dict[str, Any]]:
        """Get all available personalities"""
        personalities = []
        for file in self.personalities_dir.glob("*.json"):
            with open(file, 'r') as f:
                personalities.append(json.load(f))
        return personalities
    
    def get_personality(self, personality_id: str) -> Dict[str, Any]:
        """Get specific personality by ID"""
        personality_file = self.personalities_dir / f"{personality_id}.json"
        if personality_file.exists():
            with open(personality_file, 'r') as f:
                return json.load(f)
        else:
            return self.get_personality("default")
    
    def create_personality(
        self,
        personality_id: str,
        name: str,
        description: str,
        system_prompt: str,
        traits: List[str]
    ) -> Dict[str, Any]:
        """Create a new custom personality"""
        personality = {
            "id": personality_id,
            "name": name,
            "description": description,
            "system_prompt": system_prompt,
            "traits": traits
        }
        
        personality_file = self.personalities_dir / f"{personality_id}.json"
        with open(personality_file, 'w') as f:
            json.dump(personality, f, indent=2)
        
        return personality
'''

with open("/workspace/backend/services/personality_service.py", "w") as f:
    f.write(personality_service)

print("✅ Created personality_service.py")
print("\n📝 Note: Remaining files (ollama_service.py, image_service.py, video_service.py, main.py) are large.")
print("   We'll create them one at a time, or you can download from GitHub if you have the repo.")
print("\n✅ Step 3 complete! Ready for Step 4.")
