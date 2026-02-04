"""
Discord Bot Integration
Allows personalities to interact via Discord
"""
import discord
from discord.ext import commands
import os
import asyncio
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class DiscordBot:
    def __init__(
        self,
        ollama_service=None,
        personality_service=None,
        memory_service=None,
        task_service=None
    ):
        self.token = os.getenv("DISCORD_BOT_TOKEN")
        self.ollama_service = ollama_service
        self.personality_service = personality_service
        self.memory_service = memory_service
        self.task_service = task_service
        
        # Discord bot setup
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True
        
        self.bot = commands.Bot(command_prefix='!', intents=intents)
        self.personality_per_channel = {}  # Map channel_id -> personality_id
        self.personality_per_user = {}  # Map user_id -> personality_id
        
        self._setup_commands()
    
    def _setup_commands(self):
        """Setup Discord bot commands"""
        
        @self.bot.event
        async def on_ready():
            print(f'[DiscordBot] Logged in as {self.bot.user}')
            print(f'[DiscordBot] Connected to {len(self.bot.guilds)} guilds')
        
        @self.bot.command(name='personality')
        async def set_personality(ctx, personality_id: str = None):
            """Set personality for this channel or user"""
            if not personality_id:
                # List available personalities
                if self.personality_service:
                    personalities = self.personality_service.get_all_personalities()
                    names = [p.get('name', p.get('id')) for p in personalities]
                    await ctx.send(f"Available personalities: {', '.join(names)}")
                return
            
            # Set personality for channel
            self.personality_per_channel[ctx.channel.id] = personality_id
            await ctx.send(f"✅ Personality set to: {personality_id} for this channel")
        
        @self.bot.command(name='mypersonality')
        async def set_my_personality(ctx, personality_id: str = None):
            """Set personality for your DMs"""
            if not personality_id:
                current = self.personality_per_user.get(ctx.author.id)
                if current:
                    await ctx.send(f"Your current personality: {current}")
                else:
                    await ctx.send("No personality set. Use `!mypersonality <name>` to set one.")
                return
            
            self.personality_per_user[ctx.author.id] = personality_id
            await ctx.send(f"✅ Your personality set to: {personality_id}")
        
        @self.bot.command(name='task')
        async def create_task(ctx, task_type: str, *args):
            """Create an autonomous task"""
            if not self.task_service:
                await ctx.send("❌ Task service not available")
                return
            
            # Parse task data from args
            task_data = {"message": " ".join(args)} if args else {}
            
            personality_id = self.personality_per_channel.get(ctx.channel.id) or "default"
            
            task = self.task_service.create_task(
                personality_id=personality_id,
                task_type=task_type,
                task_data=task_data,
                schedule="daily",
                user_id=str(ctx.author.id)
            )
            
            await ctx.send(f"✅ Task created: {task['id']} (type: {task_type})")
        
        @self.bot.event
        async def on_message(message):
            # Ignore bot's own messages
            if message.author == self.bot.user:
                return
            
            # Handle commands
            await self.bot.process_commands(message)
            
            # Handle regular messages (chat with personality)
            if message.content.startswith('!'):
                return  # Commands handled above
            
            # Get personality for this channel or user
            personality_id = None
            if isinstance(message.channel, discord.DMChannel):
                personality_id = self.personality_per_user.get(message.author.id)
            else:
                personality_id = self.personality_per_channel.get(message.channel.id)
            
            if not personality_id:
                # Default personality
                personality_id = "default"
            
            # Get personality
            if not self.personality_service or not self.ollama_service:
                return
            
            personality = self.personality_service.get_personality(personality_id)
            
            # Get context from memory
            context = None
            if self.memory_service:
                memory_context = self.memory_service.get_context_for_personality(
                    personality_id,
                    user_id=str(message.author.id),
                    max_conversations=20
                )
                # Convert to message format
                context = []
                for conv in memory_context['conversations'][:10]:
                    context.append({"role": "user", "content": conv['message']})
                    context.append({"role": "assistant", "content": conv['response']})
            
            # Show typing indicator
            async with message.channel.typing():
                # Get response
                response = await self.ollama_service.chat(
                    message.content,
                    personality=personality,
                    context=context
                )
                
                response_text = response.get("message", {}).get("content", "") or response.get("response", "")
                
                # Save to memory
                if self.memory_service:
                    self.memory_service.save_conversation(
                        personality_id,
                        message.content,
                        response_text,
                        user_id=str(message.author.id),
                        channel=f"discord_{message.channel.id}"
                    )
                
                # Send response (split if too long)
                if len(response_text) > 2000:
                    # Split into chunks
                    chunks = [response_text[i:i+2000] for i in range(0, len(response_text), 2000)]
                    for chunk in chunks:
                        await message.channel.send(chunk)
                else:
                    await message.channel.send(response_text)
    
    async def start(self):
        """Start the Discord bot"""
        if not self.token:
            print("[DiscordBot] No DISCORD_BOT_TOKEN found in environment")
            return
        
        try:
            await self.bot.start(self.token)
        except Exception as e:
            print(f"[DiscordBot] Error starting bot: {e}")
    
    def run(self):
        """Run the Discord bot (blocking)"""
        if not self.token:
            print("[DiscordBot] No DISCORD_BOT_TOKEN found in environment")
            return
        
        try:
            self.bot.run(self.token)
        except Exception as e:
            print(f"[DiscordBot] Error running bot: {e}")
