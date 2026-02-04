"""
AI Personality Platform - Main Backend API
Provides unified API for text, image, and video generation
"""
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import httpx
import os
from dotenv import load_dotenv
import json
import asyncio

from services.ollama_service import OllamaService
from services.image_service import ImageService
from services.video_service import VideoService
from services.personality_service import PersonalityService

load_dotenv()

app = FastAPI(
    title="AI Personality Platform",
    description="Open-source AI platform with text, image, and video generation",
    version="1.0.0"
)

# CORS Configuration
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
if cors_origins_env == "*":
    cors_origins = ["*"]
else:
    cors_origins = cors_origins_env.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Services
ollama_service = OllamaService()
image_service = ImageService()
video_service = VideoService()
personality_service = PersonalityService()

# Request Models
class ChatRequest(BaseModel):
    message: str
    personality: Optional[str] = "default"
    model: Optional[str] = None
    context: Optional[List[Dict[str, Any]]] = None
    stream: Optional[bool] = False
    user_profile: Optional[Dict[str, Any]] = None
    ai_profile: Optional[Dict[str, Any]] = None

class CodeRequest(BaseModel):
    code: str
    language: Optional[str] = None
    task: str  # "complete", "explain", "refactor", "debug"
    personality: Optional[str] = "developer"
    context: Optional[str] = None

class ImageRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = ""
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    steps: Optional[int] = 50
    guidance_scale: Optional[float] = 7.5
    seed: Optional[int] = None

class VideoRequest(BaseModel):
    prompt: Optional[str] = None
    image_url: Optional[str] = None
    duration: Optional[int] = 4  # seconds
    fps: Optional[int] = 24
    seed: Optional[int] = None

# Health Check
@app.get("/")
async def root():
    return {
        "status": "online",
        "services": {
            "ollama": await ollama_service.check_health(),
            "image": await image_service.check_health(),
            "video": await video_service.check_health()
        }
    }

# Personality Endpoints
@app.get("/personalities")
async def get_personalities():
    """Get all available personalities"""
    try:
        personalities = personality_service.get_all_personalities()
        print(f"[DEBUG] Returning {len(personalities)} personalities")
        print(f"[DEBUG] Personality IDs: {[p.get('id', 'unknown') for p in personalities]}")
        return personalities
    except Exception as e:
        print(f"[ERROR] Failed to get personalities: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to load personalities: {str(e)}")

@app.get("/personalities/{personality_id}")
async def get_personality(personality_id: str):
    """Get specific personality details"""
    return personality_service.get_personality(personality_id)

# Chat/Text Generation
@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat with AI using selected personality"""
    try:
        personality = personality_service.get_personality(request.personality)
        
        # Build enhanced context with user and AI profiles
        enhanced_context = request.context or []
        if request.user_profile:
            enhanced_context.insert(0, {
                "role": "system",
                "content": f"User profile: {request.user_profile.get('name', 'User')} is {request.user_profile.get('ethnicity', '')} {request.user_profile.get('gender', '')}. {request.user_profile.get('interests', '')} {request.user_profile.get('background', '')}"
            })
        if request.ai_profile:
            ai_info = f"AI profile: {request.ai_profile.get('name', 'AI Assistant')} is {request.ai_profile.get('ethnicity', '')} {request.ai_profile.get('gender', '')}"
            if request.ai_profile.get('traits'):
                ai_info += f". Traits: {', '.join(request.ai_profile.get('traits', []))}"
            if request.ai_profile.get('preferredLanguage'):
                ai_info += f". Preferred language: {request.ai_profile.get('preferredLanguage')}"
            enhanced_context.insert(0, {
                "role": "system",
                "content": ai_info
            })
        
        # Pass preferred language to personality system prompt builder
        preferred_language = request.ai_profile.get('preferredLanguage') if request.ai_profile else None
        
        if request.stream:
            return StreamingResponse(
                ollama_service.chat_stream(
                    request.message,
                    personality=personality,
                    model=request.model,
                    context=enhanced_context if enhanced_context else None,
                    preferred_language=preferred_language
                ),
                media_type="text/event-stream"
            )
        else:
            response = await ollama_service.chat(
                request.message,
                personality=personality,
                model=request.model,
                context=enhanced_context if enhanced_context else None,
                preferred_language=preferred_language
            )
            return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Code Generation & Assistance (Cursor-like features)
@app.post("/api/code/complete")
async def complete_code(request: CodeRequest):
    """Code completion with context awareness"""
    try:
        personality = personality_service.get_personality(request.personality)
        response = await ollama_service.complete_code(
            request.code,
            request.task,
            language=request.language,
            context=request.context,
            personality=personality
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/code/explain")
async def explain_code(request: CodeRequest):
    """Explain code functionality"""
    try:
        personality = personality_service.get_personality(request.personality)
        response = await ollama_service.explain_code(
            request.code,
            language=request.language,
            personality=personality
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/code/refactor")
async def refactor_code(request: CodeRequest):
    """Refactor code with suggestions"""
    try:
        personality = personality_service.get_personality(request.personality)
        response = await ollama_service.refactor_code(
            request.code,
            language=request.language,
            context=request.context,
            personality=personality
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Image Generation
@app.post("/api/image/generate")
async def generate_image(request: ImageRequest):
    """Generate image from text prompt (no filters)"""
    try:
        result = await image_service.generate(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            width=request.width,
            height=request.height,
            steps=request.steps,
            guidance_scale=request.guidance_scale,
            seed=request.seed
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Video Generation
@app.post("/api/video/generate")
async def generate_video(request: VideoRequest):
    """Generate video from text prompt or image (no filters)"""
    try:
        result = await video_service.generate(
            prompt=request.prompt,
            image_url=request.image_url,
            duration=request.duration,
            fps=request.fps,
            seed=request.seed
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/video/generate-from-image")
async def generate_video_from_image(file: UploadFile = File(...), duration: int = 4):
    """Generate video from uploaded image"""
    try:
        image_data = await file.read()
        result = await video_service.generate_from_image(
            image_data=image_data,
            duration=duration
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
