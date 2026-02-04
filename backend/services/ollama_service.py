"""
Ollama Service - Handles text generation and coding assistance
Includes Cursor-like features for code completion and context awareness
"""
import httpx
import os
import json
from typing import Optional, List, Dict, Any, AsyncGenerator
from dotenv import load_dotenv

load_dotenv()

class OllamaService:
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.default_model = os.getenv("OLLAMA_MODEL", "llama3.1:70b")
        
    async def check_health(self) -> bool:
        """Check if Ollama service is available"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except:
            return False
    
    async def chat(
        self,
        message: str,
        personality: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
        context: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Send chat message to Ollama"""
        model = model or self.default_model
        
        # Build system prompt with personality
        system_prompt = self._build_system_prompt(personality)
        
        # Build messages with context
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        if context:
            messages.extend(context)
        
        messages.append({"role": "user", "content": message})
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def chat_stream(
        self,
        message: str,
        personality: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
        context: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream chat response from Ollama"""
        model = model or self.default_model
        
        system_prompt = self._build_system_prompt(personality)
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if context:
            messages.extend(context)
        messages.append({"role": "user", "content": message})
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": True
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield f"data: {json.dumps(data)}\n\n"
                        except json.JSONDecodeError:
                            continue
    
    async def complete_code(
        self,
        code: str,
        task: str,
        language: Optional[str] = None,
        context: Optional[str] = None,
        personality: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Code completion with context awareness (Cursor-like)"""
        model = self.default_model
        
        system_prompt = """You are an expert code completion assistant. 
        Provide accurate, context-aware code completions.
        Consider the surrounding code, imports, and project structure.
        Return only the completion, no explanations unless requested."""
        
        if personality:
            system_prompt = personality.get("system_prompt", system_prompt)
        
        prompt = f"""Complete the following code:
        
Language: {language or 'auto-detect'}
Task: {task}

Context:
{context or 'No additional context'}

Code to complete:
```{language or ''}
{code}
```

Provide the completion:"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False
                }
            )
            response.raise_for_status()
            result = response.json()
            return {
                "completion": result.get("message", {}).get("content", ""),
                "model": model
            }
    
    async def explain_code(
        self,
        code: str,
        language: Optional[str] = None,
        personality: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Explain code functionality"""
        model = self.default_model
        
        prompt = f"""Explain this code in detail:

```{language or ''}
{code}
```

Provide a clear explanation of what this code does, how it works, and any important details."""
        
        messages = [
            {"role": "user", "content": prompt}
        ]
        
        if personality:
            system_prompt = personality.get("system_prompt", "")
            if system_prompt:
                messages.insert(0, {"role": "system", "content": system_prompt})
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False
                }
            )
            response.raise_for_status()
            result = response.json()
            return {
                "explanation": result.get("message", {}).get("content", ""),
                "model": model
            }
    
    async def refactor_code(
        self,
        code: str,
        language: Optional[str] = None,
        context: Optional[str] = None,
        personality: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Refactor code with improvements"""
        model = self.default_model
        
        prompt = f"""Refactor and improve this code:

```{language or ''}
{code}
```

Context: {context or 'No additional context'}

Provide the refactored code with explanations of improvements."""
        
        messages = [
            {"role": "user", "content": prompt}
        ]
        
        if personality:
            system_prompt = personality.get("system_prompt", "")
            if system_prompt:
                messages.insert(0, {"role": "system", "content": system_prompt})
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False
                }
            )
            response.raise_for_status()
            result = response.json()
            return {
                "refactored": result.get("message", {}).get("content", ""),
                "model": model
            }
    
    def _build_system_prompt(self, personality: Optional[Dict[str, Any]]) -> Optional[str]:
        """Build system prompt from personality"""
        if not personality:
            return None
        
        system_prompt = personality.get("system_prompt", "")
        traits = personality.get("traits", [])
        
        if traits:
            trait_text = ", ".join(traits)
            if system_prompt:
                system_prompt += f"\n\nPersonality traits: {trait_text}"
            else:
                system_prompt = f"Personality traits: {trait_text}"
        
        return system_prompt if system_prompt else None
