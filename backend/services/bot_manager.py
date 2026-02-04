"""
Bot Manager - Manages per-user bot instances
Allows users to connect their own Discord/Telegram/WhatsApp bots
"""
import os
import asyncio
from typing import Dict, Optional, Any
from services.discord_bot import DiscordBot
from services.telegram_bot import TelegramBot
from services.whatsapp_bot import WhatsAppBot

class BotManager:
    def __init__(
        self,
        ollama_service=None,
        personality_service=None,
        memory_service=None,
        task_service=None
    ):
        self.ollama_service = ollama_service
        self.personality_service = personality_service
        self.memory_service = memory_service
        self.task_service = task_service
        
        # Store active bot instances per user
        self.user_bots: Dict[str, Dict[str, Any]] = {}  # {user_id: {discord: bot, telegram: bot, ...}}
        self.running = False
    
    async def start_user_bot(self, user_id: str, bot_type: str, token: str):
        """Start a bot instance for a specific user"""
        if user_id not in self.user_bots:
            self.user_bots[user_id] = {}
        
        if bot_type in self.user_bots[user_id]:
            # Bot already running, stop it first
            await self.stop_user_bot(user_id, bot_type)
        
        try:
            if bot_type == "discord":
                bot = DiscordBot(
                    ollama_service=self.ollama_service,
                    personality_service=self.personality_service,
                    memory_service=self.memory_service,
                    task_service=self.task_service
                )
                bot.token = token
                self.user_bots[user_id][bot_type] = bot
                asyncio.create_task(bot.start())
                print(f"[BotManager] Started Discord bot for user {user_id}")
            
            elif bot_type == "telegram":
                bot = TelegramBot(
                    ollama_service=self.ollama_service,
                    personality_service=self.personality_service,
                    memory_service=self.memory_service,
                    task_service=self.task_service
                )
                bot.token = token
                bot.app = bot.app.__class__.builder().token(token).build()
                bot._setup_handlers()
                self.user_bots[user_id][bot_type] = bot
                asyncio.create_task(bot.start())
                print(f"[BotManager] Started Telegram bot for user {user_id}")
            
            elif bot_type == "whatsapp":
                # WhatsApp uses Twilio, so we just store the credentials
                bot = WhatsAppBot(
                    ollama_service=self.ollama_service,
                    personality_service=self.personality_service,
                    memory_service=self.memory_service,
                    task_service=self.task_service
                )
                # For WhatsApp, tokens are account_sid and auth_token
                # This would need to be parsed from the token string
                self.user_bots[user_id][bot_type] = bot
                print(f"[BotManager] Configured WhatsApp bot for user {user_id}")
            
            return {"status": "success", "message": f"{bot_type} bot started"}
        
        except Exception as e:
            print(f"[BotManager] Error starting {bot_type} bot for user {user_id}: {e}")
            return {"status": "error", "message": str(e)}
    
    async def stop_user_bot(self, user_id: str, bot_type: str):
        """Stop a bot instance for a specific user"""
        if user_id in self.user_bots and bot_type in self.user_bots[user_id]:
            bot = self.user_bots[user_id][bot_type]
            if bot_type == "telegram" and hasattr(bot, 'stop'):
                await bot.stop()
            elif bot_type == "discord" and hasattr(bot, 'bot'):
                # Discord bot cleanup
                pass
            del self.user_bots[user_id][bot_type]
            print(f"[BotManager] Stopped {bot_type} bot for user {user_id}")
    
    def get_user_bot_status(self, user_id: str) -> Dict[str, bool]:
        """Get status of all bots for a user"""
        if user_id not in self.user_bots:
            return {"discord": False, "telegram": False, "whatsapp": False}
        
        return {
            "discord": "discord" in self.user_bots[user_id],
            "telegram": "telegram" in self.user_bots[user_id],
            "whatsapp": "whatsapp" in self.user_bots[user_id]
        }
    
    async def load_user_bots(self, user_id: str):
        """Load and start all active bots for a user"""
        if not self.memory_service:
            return
        
        tokens = self.memory_service.get_all_bot_tokens(user_id)
        
        for bot_type, token in tokens.items():
            if token:
                await self.start_user_bot(user_id, bot_type, token)
