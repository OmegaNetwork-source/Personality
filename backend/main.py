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
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
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
    return personality_service.get_all_personalities()

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
        
        if request.stream:
            return StreamingResponse(
                ollama_service.chat_stream(
                    request.message,
                    personality=personality,
                    model=request.model,
                    context=request.context
                ),
                media_type="text/event-stream"
            )
        else:
            response = await ollama_service.chat(
                request.message,
                personality=personality,
                model=request.model,
                context=request.context
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
