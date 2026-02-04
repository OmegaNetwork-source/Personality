"""
Image Generation Service - Stable Diffusion/FLUX integration
No filters, complete freedom for users
"""
import httpx
import os
import base64
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class ImageService:
    def __init__(self):
        self.base_url = os.getenv("STABLE_DIFFUSION_URL", "http://localhost:7860")
        self.default_model = os.getenv("STABLE_DIFFUSION_MODEL", "stable-diffusion-xl-base-1.0")
    
    async def check_health(self) -> bool:
        """Check if image generation service is available"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/")
                return response.status_code == 200
        except:
            return False
    
    async def generate(
        self,
        prompt: str,
        negative_prompt: str = "",
        width: int = 1024,
        height: int = 1024,
        steps: int = 50,
        guidance_scale: float = 7.5,
        seed: Optional[int] = None
    ) -> dict:
        """
        Generate image from text prompt
        NO FILTERS - Complete freedom for users
        """
        try:
            # Stable Diffusion API (Automatic1111/ComfyUI format)
            payload = {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "width": width,
                "height": height,
                "steps": steps,
                "cfg_scale": guidance_scale,
                "sampler_name": "DPM++ 2M Karras",
                "batch_size": 1,
            }
            
            if seed is not None:
                payload["seed"] = seed
            
            async with httpx.AsyncClient(timeout=300.0) as client:
                # Try Automatic1111 API first
                try:
                    response = await client.post(
                        f"{self.base_url}/sdapi/v1/txt2img",
                        json=payload
                    )
                    response.raise_for_status()
                    result = response.json()
                    
                    # Extract base64 image
                    if "images" in result and len(result["images"]) > 0:
                        image_b64 = result["images"][0]
                        return {
                            "image": image_b64,
                            "seed": result.get("seed", seed),
                            "info": result.get("info", "")
                        }
                except:
                    # Fallback to ComfyUI API
                    return await self._generate_comfyui(prompt, negative_prompt, width, height, steps, guidance_scale, seed)
        
        except Exception as e:
            raise Exception(f"Image generation failed: {str(e)}")
    
    async def _generate_comfyui(
        self,
        prompt: str,
        negative_prompt: str,
        width: int,
        height: int,
        steps: int,
        guidance_scale: float,
        seed: Optional[int]
    ) -> dict:
        """Generate using ComfyUI API"""
        # ComfyUI workflow would go here
        # This is a simplified version
        raise Exception("ComfyUI integration not yet implemented")
