"""
WhatsApp Bot Integration
Allows personalities to interact via WhatsApp using whatsapp-web.js approach
Note: WhatsApp integration requires additional setup (Twilio API or whatsapp-web.js)
"""
import os
import asyncio
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class WhatsAppBot:
    def __init__(
        self,
        ollama_service=None,
        personality_service=None,
        memory_service=None,
        task_service=None
    ):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.phone_number = os.getenv("TWILIO_WHATSAPP_NUMBER")
        
        self.ollama_service = ollama_service
        self.personality_service = personality_service
        self.memory_service = memory_service
        self.task_service = task_service
        
        self.personality_per_number = {}  # Map phone_number -> personality_id
        
        # Note: This is a basic implementation
        # For full WhatsApp integration, you'd need:
        # 1. Twilio API (paid service)
        # 2. Or whatsapp-web.js (Node.js library) with a bridge
        # 3. Or Baileys (Node.js WhatsApp library)
    
    async def send_message(self, to: str, message: str):
        """Send WhatsApp message via Twilio"""
        if not self.account_sid or not self.auth_token:
            print("[WhatsAppBot] Twilio credentials not configured")
            return
        
        try:
            from twilio.rest import Client
            
            client = Client(self.account_sid, self.auth_token)
            
            message = client.messages.create(
                body=message,
                from_=f'whatsapp:{self.phone_number}',
                to=f'whatsapp:{to}'
            )
            
            return message.sid
        except ImportError:
            print("[WhatsAppBot] twilio not installed. Install with: pip install twilio")
        except Exception as e:
            print(f"[WhatsAppBot] Error sending message: {e}")
    
    async def handle_incoming_message(self, from_number: str, message: str):
        """Handle incoming WhatsApp message"""
        # Get personality for this number
        personality_id = self.personality_per_number.get(from_number) or "default"
        
        # Get personality
        if not self.personality_service or not self.ollama_service:
            await self.send_message(from_number, "❌ Services not available")
            return
        
        personality = self.personality_service.get_personality(personality_id)
        
        # Get context from memory
        context = None
        if self.memory_service:
            memory_context = self.memory_service.get_context_for_personality(
                personality_id,
                user_id=from_number,
                max_conversations=20
            )
            # Convert to message format
            context = []
            for conv in memory_context['conversations'][:10]:
                context.append({"role": "user", "content": conv['message']})
                context.append({"role": "assistant", "content": conv['response']})
        
        # Get response
        response = await self.ollama_service.chat(
            message,
            personality=personality,
            context=context
        )
        
        response_text = response.get("message", {}).get("content", "") or response.get("response", "")
        
        # Save to memory
        if self.memory_service:
            self.memory_service.save_conversation(
                personality_id,
                message,
                response_text,
                user_id=from_number,
                channel="whatsapp"
            )
        
        # Send response
        await self.send_message(from_number, response_text)
    
    def set_personality(self, phone_number: str, personality_id: str):
        """Set personality for a phone number"""
        self.personality_per_number[phone_number] = personality_id
    
    async def webhook_handler(self, request_data: Dict[str, Any]):
        """Handle webhook from Twilio or WhatsApp service"""
        # This would be called by a webhook endpoint
        # Parse the incoming message and handle it
        from_number = request_data.get('From', '').replace('whatsapp:', '')
        message_body = request_data.get('Body', '')
        
        if from_number and message_body:
            await self.handle_incoming_message(from_number, message_body)
