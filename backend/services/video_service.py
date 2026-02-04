"""
Video Generation Service - Stable Video Diffusion/AnimateDiff integration
No filters, complete freedom for users
"""
import httpx
import os
import base64
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class VideoService:
    def __init__(self):
        self.base_url = os.getenv("VIDEO_GEN_URL", "http://localhost:7861")
        self.default_model = os.getenv("VIDEO_GEN_MODEL", "stable-video-diffusion")
    
    async def check_health(self) -> bool:
        """Check if video generation service is available"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/")
                return response.status_code == 200
        except:
            return False
    
    async def generate(
        self,
        prompt: Optional[str] = None,
        image_url: Optional[str] = None,
        duration: int = 4,
        fps: int = 24,
        seed: Optional[int] = None
    ) -> dict:
        """
        Generate video from text prompt or image
        NO FILTERS - Complete freedom for users
        """
        try:
            if image_url:
                # Image-to-video generation
                return await self._generate_from_image_url(image_url, duration, fps, seed)
            elif prompt:
                # Text-to-video generation
                return await self._generate_from_text(prompt, duration, fps, seed)
            else:
                raise ValueError("Either prompt or image_url must be provided")
        
        except Exception as e:
            error_msg = str(e)
            print(f"[VideoService] Error: {error_msg}")
            print(f"[VideoService] Base URL: {self.base_url}")
            raise Exception(f"Video generation failed: {error_msg}. Make sure ComfyUI is running at {self.base_url}")
    
    async def generate_from_image(
        self,
        image_data: bytes,
        duration: int = 4,
        fps: int = 24,
        seed: Optional[int] = None
    ) -> dict:
        """Generate video from uploaded image"""
        # Convert image to base64
        image_b64 = base64.b64encode(image_data).decode('utf-8')
        
        payload = {
            "image": image_b64,
            "duration": duration,
            "fps": fps,
            "motion_bucket_id": 127,  # Motion intensity
            "cond_aug": 0.02
        }
        
        if seed is not None:
            payload["seed"] = seed
        
        async with httpx.AsyncClient(timeout=600.0) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/video/generate",
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            
            return {
                "video": result.get("video", ""),
                "seed": result.get("seed", seed),
                "duration": duration,
                "fps": fps
            }
    
    async def _generate_from_image_url(
        self,
        image_url: str,
        duration: int,
        fps: int,
        seed: Optional[int]
    ) -> dict:
        """Generate video from image URL"""
        # Download image first
        async with httpx.AsyncClient() as client:
            img_response = await client.get(image_url)
            img_response.raise_for_status()
            return await self.generate_from_image(img_response.content, duration, fps, seed)
    
    async def _generate_from_text(
        self,
        prompt: str,
        duration: int,
        fps: int,
        seed: Optional[int]
    ) -> dict:
        """Generate video from text prompt (text-to-video)"""
        payload = {
            "prompt": prompt,
            "duration": duration,
            "fps": fps,
            "width": 1024,
            "height": 576,
            "num_inference_steps": 50
        }
        
        if seed is not None:
            payload["seed"] = seed
        
        async with httpx.AsyncClient(timeout=600.0) as client:
            response = await client.post(
                f"{self.base_url}/api/v1/video/text2video",
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            
            return {
                "video": result.get("video", ""),
                "seed": result.get("seed", seed),
                "duration": duration,
                "fps": fps
            }
