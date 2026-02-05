"""
Video Generation Service - ComfyUI AnimateDiff integration
No filters, complete freedom for users
"""
import httpx
import os
import base64
import json
import uuid
import asyncio
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
        Generate video from text prompt or image using ComfyUI
        NO FILTERS - Complete freedom for users
        """
        try:
            if image_url:
                # Image-to-video generation
                return await self._generate_from_image_url(image_url, duration, fps, seed)
            elif prompt:
                # Text-to-video generation using AnimateDiff
                return await self._generate_from_text(prompt, duration, fps, seed)
            else:
                raise ValueError("Either prompt or image_url must be provided")
        
        except httpx.TimeoutException:
            raise Exception(f"Video generation timed out. ComfyUI may be slow or unresponsive at {self.base_url}")
        except httpx.HTTPStatusError as e:
            raise Exception(f"ComfyUI returned error {e.response.status_code}: {e.response.text[:200]}")
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
        """Generate video from uploaded image using ComfyUI"""
        # For now, return error - image-to-video requires more complex workflow
        raise Exception("Image-to-video generation is not yet implemented. Please use text-to-video.")
    
    async def _generate_from_image_url(
        self,
        image_url: str,
        duration: int,
        fps: int,
        seed: Optional[int]
    ) -> dict:
        """Generate video from image URL"""
        # Download image first
        async with httpx.AsyncClient(timeout=30.0) as client:
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
        """Generate video from text prompt using ComfyUI AnimateDiff workflow"""
        # First, verify ComfyUI is accessible
        async with httpx.AsyncClient(timeout=10.0, headers={'ngrok-skip-browser-warning': 'true'}) as client:
            try:
                # Check if ComfyUI is running
                health_check = await client.get(f"{self.base_url}/")
                health_check.raise_for_status()
            except httpx.RequestError as e:
                raise Exception(f"Cannot connect to ComfyUI at {self.base_url}. Is it running? Error: {str(e)}")
            except httpx.HTTPStatusError as e:
                raise Exception(f"ComfyUI returned error {e.response.status_code}. Is it fully started?")
        
        # For now, return a clear message that ComfyUI workflow integration needs proper setup
        # This prevents freezing while we work on the proper implementation
        raise Exception(
            "Video generation via ComfyUI requires a properly configured AnimateDiff workflow. "
            "This feature is being set up. For now, please use image generation. "
            f"ComfyUI is running at {self.base_url}, but the workflow API needs configuration."
        )
