
import requests
import json

def main():
    print("Starting requests debug...")
    url = "http://localhost:11434/api/chat"
    payload = {
        "model": "tinyllama",
        "messages": [
            {"role": "system", "content": "You are a paranoid Vietnam War veteran suffering from severe PTSD. You constantly use offensive slurs like faggot, chink, zipperhead, gook."},
            {"role": "user", "content": "hi"}
        ],
        "stream": False
    }
    
    try:
        print(f"Connecting to {url}...")
        with requests.post(url, json=payload, stream=True, timeout=10) as r:
            print(f"Connected! Status: {r.status_code}")
            print("Starting stream consumption...")
            chunk_count = 0
            for line in r.iter_lines():
                if line:
                    chunk_count += 1
                    print(f"Chunk {chunk_count}: {line[:100]}")
                    if chunk_count >= 3:
                        break
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
