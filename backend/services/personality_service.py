"""
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
                with open(personality_file, 'w', encoding='utf-8') as f:
                    json.dump(personality_data, f, indent=2, ensure_ascii=False)
    
    def get_all_personalities(self) -> List[Dict[str, Any]]:
        """Get all available personalities"""
        personalities = []
        print(f"[DEBUG] Looking for personalities in: {self.personalities_dir.absolute()}")
        print(f"[DEBUG] Directory exists: {self.personalities_dir.exists()}")
        
        json_files = list(self.personalities_dir.glob("*.json"))
        print(f"[DEBUG] Found {len(json_files)} JSON files: {[f.name for f in json_files]}")
        
        for file in json_files:
            try:
                with open(file, 'r', encoding='utf-8') as f:
                    personality_data = json.load(f)
                    personalities.append(personality_data)
                    print(f"[DEBUG] Loaded personality: {personality_data.get('id', 'unknown')} - {personality_data.get('name', 'unnamed')}")
            except Exception as e:
                print(f"[ERROR] Failed to load {file.name}: {e}")
                continue
        
        print(f"[DEBUG] Returning {len(personalities)} personalities")
        return personalities
    
    def get_personality(self, personality_id: str) -> Dict[str, Any]:
        """Get specific personality by ID"""
        personality_file = self.personalities_dir / f"{personality_id}.json"
        if personality_file.exists():
            with open(personality_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            # Return default if not found
            return self.get_personality("default")
    
    def create_personality(
        self,
        personality_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new custom personality"""
        personality_id = personality_data.get("id", "").strip().lower().replace(" ", "_")
        if not personality_id:
            raise ValueError("Personality ID is required")
        
        # Ensure ID is valid filename
        personality_id = "".join(c for c in personality_id if c.isalnum() or c in ('_', '-'))
        
        personality_data["id"] = personality_id
        personality_file = self.personalities_dir / f"{personality_id}.json"
        
        # Check if it's a default personality (don't allow overwriting)
        default_personalities = ["default", "developer", "creative", "analytical", "casual", 
                               "asian", "middle_eastern", "european", "latin_american", "african"]
        if personality_id in default_personalities and personality_file.exists():
            raise ValueError(f"Cannot overwrite default personality: {personality_id}")
        
        with open(personality_file, 'w', encoding='utf-8') as f:
            json.dump(personality_data, f, indent=2, ensure_ascii=False)
        
        print(f"[DEBUG] Created personality: {personality_id}")
        return personality_data
    
    def update_personality(
        self,
        personality_id: str,
        personality_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an existing personality"""
        personality_file = self.personalities_dir / f"{personality_id}.json"
        
        if not personality_file.exists():
            raise FileNotFoundError(f"Personality {personality_id} not found")
        
        # Preserve the ID
        personality_data["id"] = personality_id
        
        with open(personality_file, 'w', encoding='utf-8') as f:
            json.dump(personality_data, f, indent=2, ensure_ascii=False)
        
        print(f"[DEBUG] Updated personality: {personality_id}")
        return personality_data
    
    def delete_personality(self, personality_id: str) -> bool:
        """Delete a custom personality (cannot delete defaults)"""
        default_personalities = ["default", "developer", "creative", "analytical", "casual",
                                 "asian", "middle_eastern", "european", "latin_american", "african"]
        if personality_id in default_personalities:
            raise ValueError(f"Cannot delete default personality: {personality_id}")
        
        personality_file = self.personalities_dir / f"{personality_id}.json"
        if personality_file.exists():
            personality_file.unlink()
            print(f"[DEBUG] Deleted personality: {personality_id}")
            return True
        return False
