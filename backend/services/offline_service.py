
import asyncio
import json
import random
from typing import AsyncGenerator, Dict, Any, List, Optional

class OfflineService:
    def __init__(self):
        print("[OfflineService] Initialized Fake AI Mode")

    async def get_models(self) -> List[Dict[str, str]]:
        return [{"name": "offline-mode", "modified_at": "2024-01-01"}]

    async def pull_model(self, model_name: str) -> AsyncGenerator[str, None]:
        yield json.dumps({"status": "done"})

    async def chat_stream(
        self,
        message: str,
        personality: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
        context: Optional[List[Dict[str, Any]]] = None,
        preferred_language: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        
        # 1. Select a response
        response_text = "I don't have anything to say about that."
        
        if personality and "canned_responses" in personality:
            responses = personality["canned_responses"]
            
            # Check for Greeting Condition
            # If context is empty or None, it's likely the first message
            is_start = not context or len(context) == 0
            
            if is_start and "greeting_response" in personality:
                response_text = personality["greeting_response"]
                print(f"[OfflineService] Triggered specific greeting: '{response_text[:30]}...'")
            elif responses:
                response_text = random.choice(responses)
                print(f"[OfflineService] Selected canned response: '{response_text[:30]}...'")
            else:
                print("[OfflineService] Personality has no canned_responses!")
        
        # 2. Simulate "Thinking" (Network Latency)
        # Random delay between 0.5s and 1.5s
        await asyncio.sleep(random.uniform(0.5, 1.5))
        
        # 3. Simulate "Typing" (Streaming)
        # We split by words to make it feel natural
        words = response_text.split(" ")
        current_text = ""
        
        for i, word in enumerate(words):
            # Add space if not first word
            prefix = " " if i > 0 else ""
            chunk = prefix + word
            
            # Send chunk in Ollama format
            data = {
                "model": "offline",
                "created_at": "2024",
                "message": {"role": "assistant", "content": chunk},
                "done": False
            }
            yield f"data: {json.dumps(data)}\n\n"
            
            # Simulate typing speed (faster for short words, slower for long)
            # FAST: 0.01 - 0.05s per word
            await asyncio.sleep(random.uniform(0.02, 0.08))

        # 4. Send Done Signal
        final_data = {
            "model": "offline",
            "created_at": "2024",
            "message": {"role": "assistant", "content": ""},
            "done": True
        }
        yield f"data: {json.dumps(final_data)}\n\n"
