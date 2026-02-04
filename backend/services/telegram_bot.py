"""
Telegram Bot Integration
Allows personalities to interact via Telegram
"""
import os
import asyncio
from typing import Optional, Dict, Any
from dotenv import load_dotenv

try:
    from telegram import Update
    from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
    TELEGRAM_AVAILABLE = True
except ImportError:
    TELEGRAM_AVAILABLE = False
    print("[TelegramBot] python-telegram-bot not installed. Install with: pip install python-telegram-bot")

load_dotenv()

class TelegramBot:
    def __init__(
        self,
        ollama_service=None,
        personality_service=None,
        memory_service=None,
        task_service=None
    ):
        if not TELEGRAM_AVAILABLE:
            raise ImportError("python-telegram-bot is required. Install with: pip install python-telegram-bot")
        
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.ollama_service = ollama_service
        self.personality_service = personality_service
        self.memory_service = memory_service
        self.task_service = task_service
        
        self.personality_per_chat = {}  # Map chat_id -> personality_id
        self.personality_per_user = {}  # Map user_id -> personality_id
        
        if self.token:
            self.app = Application.builder().token(self.token).build()
            self._setup_handlers()
    
    def _setup_handlers(self):
        """Setup Telegram bot handlers"""
        
        async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
            """Handle /start command"""
            await update.message.reply_text(
                "👋 Hello! I'm your AI Personality Bot.\n\n"
                "Use /personality <name> to set a personality for this chat\n"
                "Use /mypersonality <name> to set your personal personality\n"
                "Use /task <type> <data> to create autonomous tasks\n\n"
                "Just send a message to chat with the current personality!"
            )
        
        async def set_personality(update: Update, context: ContextTypes.DEFAULT_TYPE):
            """Handle /personality command"""
            if not context.args:
                # List available personalities
                if self.personality_service:
                    personalities = self.personality_service.get_all_personalities()
                    names = [p.get('name', p.get('id')) for p in personalities]
                    await update.message.reply_text(f"Available personalities: {', '.join(names)}")
                return
            
            personality_id = context.args[0]
            self.personality_per_chat[update.effective_chat.id] = personality_id
            await update.message.reply_text(f"✅ Personality set to: {personality_id} for this chat")
        
        async def set_my_personality(update: Update, context: ContextTypes.DEFAULT_TYPE):
            """Handle /mypersonality command"""
            if not context.args:
                current = self.personality_per_user.get(update.effective_user.id)
                if current:
                    await update.message.reply_text(f"Your current personality: {current}")
                else:
                    await update.message.reply_text("No personality set. Use /mypersonality <name> to set one.")
                return
            
            personality_id = context.args[0]
            self.personality_per_user[update.effective_user.id] = personality_id
            await update.message.reply_text(f"✅ Your personality set to: {personality_id}")
        
        async def create_task(update: Update, context: ContextTypes.DEFAULT_TYPE):
            """Handle /task command"""
            if not self.task_service:
                await update.message.reply_text("❌ Task service not available")
                return
            
            if len(context.args) < 2:
                await update.message.reply_text("Usage: /task <type> <message>")
                return
            
            task_type = context.args[0]
            task_data = {"message": " ".join(context.args[1:])}
            
            personality_id = self.personality_per_chat.get(update.effective_chat.id) or "default"
            
            task = self.task_service.create_task(
                personality_id=personality_id,
                task_type=task_type,
                task_data=task_data,
                schedule="daily",
                user_id=str(update.effective_user.id)
            )
            
            await update.message.reply_text(f"✅ Task created: {task['id']} (type: {task_type})")
        
        async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
            """Handle regular messages"""
            if not update.message or not update.message.text:
                return
            
            # Get personality for this chat or user
            personality_id = None
            if update.effective_chat.type == "private":
                personality_id = self.personality_per_user.get(update.effective_user.id)
            else:
                personality_id = self.personality_per_chat.get(update.effective_chat.id)
            
            if not personality_id:
                personality_id = "default"
            
            # Get personality
            if not self.personality_service or not self.ollama_service:
                await update.message.reply_text("❌ Services not available")
                return
            
            personality = self.personality_service.get_personality(personality_id)
            
            # Get context from memory
            context_messages = None
            if self.memory_service:
                memory_context = self.memory_service.get_context_for_personality(
                    personality_id,
                    user_id=str(update.effective_user.id),
                    max_conversations=20
                )
                # Convert to message format
                context_messages = []
                for conv in memory_context['conversations'][:10]:
                    context_messages.append({"role": "user", "content": conv['message']})
                    context_messages.append({"role": "assistant", "content": conv['response']})
            
            # Show typing indicator
            await context.bot.send_chat_action(
                chat_id=update.effective_chat.id,
                action="typing"
            )
            
            # Get response
            response = await self.ollama_service.chat(
                update.message.text,
                personality=personality,
                context=context_messages
            )
            
            response_text = response.get("message", {}).get("content", "") or response.get("response", "")
            
            # Save to memory
            if self.memory_service:
                self.memory_service.save_conversation(
                    personality_id,
                    update.message.text,
                    response_text,
                    user_id=str(update.effective_user.id),
                    channel=f"telegram_{update.effective_chat.id}"
                )
            
            # Send response
            await update.message.reply_text(response_text)
        
        # Register handlers
        self.app.add_handler(CommandHandler("start", start))
        self.app.add_handler(CommandHandler("personality", set_personality))
        self.app.add_handler(CommandHandler("mypersonality", set_my_personality))
        self.app.add_handler(CommandHandler("task", create_task))
        self.app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    async def start(self):
        """Start the Telegram bot"""
        if not self.token:
            print("[TelegramBot] No TELEGRAM_BOT_TOKEN found in environment")
            return
        
        try:
            await self.app.initialize()
            await self.app.start()
            await self.app.updater.start_polling()
            print("[TelegramBot] Bot started and polling...")
        except Exception as e:
            print(f"[TelegramBot] Error starting bot: {e}")
    
    async def stop(self):
        """Stop the Telegram bot"""
        if hasattr(self, 'app'):
            await self.app.updater.stop()
            await self.app.stop()
            await self.app.shutdown()
    
    def run(self):
        """Run the Telegram bot (blocking)"""
        if not self.token:
            print("[TelegramBot] No TELEGRAM_BOT_TOKEN found in environment")
            return
        
        try:
            self.app.run_polling()
        except Exception as e:
            print(f"[TelegramBot] Error running bot: {e}")
