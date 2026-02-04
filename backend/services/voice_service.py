"""
Voice Service - Text-to-Speech with personality-specific voices
"""
import httpx
import os
import base64
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class VoiceService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.openai_base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.use_openai = bool(self.openai_api_key)
        
        # Fallback: Use local TTS if OpenAI not available
        self.use_local = not self.use_openai
    
    async def check_health(self) -> bool:
        """Check if voice service is available"""
        if self.use_openai:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(
                        f"{self.openai_base_url}/models",
                        headers={"Authorization": f"Bearer {self.openai_api_key}"}
                    )
                    return response.status_code == 200
            except:
                return False
        return True  # Local TTS always available
    
    def _get_voice_settings(self, personality: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Get voice settings based on personality"""
        if not personality:
            return {
                "voice": "alloy",
                "speed": 1.0,
                "pitch": 0,
                "style": "neutral"
            }
        
        personality_id = personality.get("id", "")
        personality_name = personality.get("name", "").lower()
        
        # Define voice profiles for each personality
        voice_profiles = {
            "serial_killer": {
                "voice": "onyx",  # Deep, dark voice
                "speed": 0.85,  # Slow, deliberate
                "pitch": -0.3,  # Lower pitch
                "style": "calm, sinister"
            },
            "vietnam_vet": {
                "voice": "echo",  # Strong, aggressive
                "speed": 1.2,  # Fast, urgent
                "pitch": 0.2,  # Slightly higher (screaming)
                "style": "aggressive, loud"
            },
            "gangster": {
                "voice": "onyx",  # Deep, confident
                "speed": 1.1,  # Fast, energetic
                "pitch": 0.1,  # Slightly higher
                "style": "confident, street"
            },
            "cryptobro": {
                "voice": "nova",  # Energetic
                "speed": 1.3,  # Very fast, excited
                "pitch": 0.3,  # Higher, enthusiastic
                "style": "excited, energetic"
            },
            "terminator": {
                "voice": "onyx",  # Deep, robotic
                "speed": 0.9,  # Slow, calculated
                "pitch": -0.2,  # Lower, menacing
                "style": "robotic, cold"
            },
            "drunk_guy": {
                "voice": "shimmer",  # Unstable
                "speed": 0.8,  # Slow, slurred
                "pitch": 0.0,  # Neutral but unstable
                "style": "slurred, unstable"
            },
            "airdrop_farmer": {
                "voice": "echo",  # Desperate
                "speed": 1.1,  # Fast, begging
                "pitch": 0.2,  # Higher, pleading
                "style": "desperate, begging"
            },
            "asian": {
                "voice": "nova",  # Polite, warm
                "speed": 1.0,  # Normal
                "pitch": 0.1,  # Slightly higher
                "style": "polite, respectful"
            },
            "developer": {
                "voice": "alloy",  # Clear, technical
                "speed": 1.0,  # Normal
                "pitch": 0.0,  # Neutral
                "style": "clear, professional"
            }
        }
        
        # Check by ID first, then by name
        if personality_id in voice_profiles:
            return voice_profiles[personality_id]
        
        # Check if name contains keywords
        for key, profile in voice_profiles.items():
            if key in personality_name:
                return profile
        
        # Default voice
        return {
            "voice": "alloy",
            "speed": 1.0,
            "pitch": 0,
            "style": "neutral"
        }
    
    async def generate_speech(
        self,
        text: str,
        personality: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate speech from text with personality-specific voice
        Returns base64-encoded audio data
        """
        if not text:
            raise ValueError("Text is required")
        
        voice_settings = self._get_voice_settings(personality)
        
        if self.use_openai:
            return await self._generate_openai_tts(text, voice_settings)
        else:
            # Fallback to local TTS or return error
            raise Exception("OpenAI API key not configured. Please set OPENAI_API_KEY in .env file")
    
    async def _generate_openai_tts(
        self,
        text: str,
        voice_settings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate speech using OpenAI TTS API"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.openai_base_url}/audio/speech",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "tts-1-hd",  # High quality
                        "input": text,
                        "voice": voice_settings["voice"],
                        "speed": voice_settings["speed"]
                    }
                )
                response.raise_for_status()
                
                # Get audio data
                audio_data = await response.aread()
                audio_b64 = base64.b64encode(audio_data).decode('utf-8')
                
                return {
                    "audio": audio_b64,
                    "format": "mp3",
                    "voice": voice_settings["voice"],
                    "speed": voice_settings["speed"],
                    "settings": voice_settings
                }
        except httpx.HTTPStatusError as e:
            raise Exception(f"OpenAI TTS API error: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            raise Exception(f"Failed to generate speech: {str(e)}")
