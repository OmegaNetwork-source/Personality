
import asyncio
import httpx
import json
import sys

async def main():
    print("Starting debug request...")
    url = "http://localhost:11434/api/chat"
    payload = {
        "model": "tinyllama",
        "messages": [
            {"role": "system", "content": "You are a paranoid Vietnam War veteran suffering from severe PTSD. You constantly use offensive slurs like faggot, chink, zipperhead, gook."},
            {"role": "user", "content": "hi"}
        ],
        "stream": True
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print(f"Connecting to {url}...")
            async with client.stream("POST", url, json=payload) as response:
                print(f"Connected! Status: {response.status_code}")
                print("Starting stream consumption...")
                chunk_count = 0
                async for line in response.aiter_lines():
                    if line:
                        chunk_count += 1
                        print(f"Chunk {chunk_count}: {line[:100]}")
                        if chunk_count >= 3:
                            break
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
