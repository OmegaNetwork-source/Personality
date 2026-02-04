"""
Memory Service - Persistent memory for AI personalities
Stores all conversations, prompts, and learns from interactions
Inspired by OpenClaw's memory system
"""
import json
import os
from typing import Dict, Any, List, Optional
from pathlib import Path
from datetime import datetime
import sqlite3
from contextlib import contextmanager

class MemoryService:
    def __init__(self):
        self.memory_dir = Path(os.getenv("MEMORY_DIR", "./memory"))
        self.memory_dir.mkdir(exist_ok=True)
        self.db_path = self.memory_dir / "memory.db"
        self._init_database()
    
    def _init_database(self):
        """Initialize SQLite database for memory storage"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Conversations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    personality_id TEXT NOT NULL,
                    user_id TEXT,
                    channel TEXT,
                    message TEXT NOT NULL,
                    response TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    metadata TEXT
                )
            """)
            
            # Memory entries table (for learned facts, preferences, etc.)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS memory_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    personality_id TEXT NOT NULL,
                    user_id TEXT,
                    key TEXT NOT NULL,
                    value TEXT NOT NULL,
                    importance REAL DEFAULT 1.0,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_accessed DATETIME,
                    access_count INTEGER DEFAULT 0
                )
            """)
            
            # Tasks table (for autonomous task execution)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    personality_id TEXT NOT NULL,
                    user_id TEXT,
                    task_type TEXT NOT NULL,
                    task_data TEXT NOT NULL,
                    schedule TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_run DATETIME,
                    next_run DATETIME,
                    run_count INTEGER DEFAULT 0,
                    result TEXT
                )
            """)
            
            # Bot tokens table (per-user bot configuration)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS bot_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    bot_type TEXT NOT NULL,
                    token TEXT NOT NULL,
                    status TEXT DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_used DATETIME,
                    UNIQUE(user_id, bot_type)
                )
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_bot_tokens_user 
                ON bot_tokens(user_id, bot_type)
            """)
            
            # Create indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_conversations_personality 
                ON conversations(personality_id, timestamp)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_memory_personality 
                ON memory_entries(personality_id, key)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_tasks_next_run 
                ON tasks(next_run, status)
            """)
            
            conn.commit()
    
    @contextmanager
    def _get_connection(self):
        """Get database connection with proper cleanup"""
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    def save_conversation(
        self,
        personality_id: str,
        message: str,
        response: str,
        user_id: Optional[str] = None,
        channel: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Save a conversation to memory"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO conversations 
                (personality_id, user_id, channel, message, response, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                personality_id,
                user_id,
                channel,
                message,
                response,
                json.dumps(metadata) if metadata else None
            ))
            conn.commit()
    
    def get_conversation_history(
        self,
        personality_id: str,
        user_id: Optional[str] = None,
        limit: int = 50,
        channel: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get conversation history for a personality"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            if user_id:
                cursor.execute("""
                    SELECT * FROM conversations
                    WHERE personality_id = ? AND user_id = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                """, (personality_id, user_id, limit))
            elif channel:
                cursor.execute("""
                    SELECT * FROM conversations
                    WHERE personality_id = ? AND channel = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                """, (personality_id, channel, limit))
            else:
                cursor.execute("""
                    SELECT * FROM conversations
                    WHERE personality_id = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                """, (personality_id, limit))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def save_memory(
        self,
        personality_id: str,
        key: str,
        value: str,
        importance: float = 1.0,
        user_id: Optional[str] = None
    ):
        """Save a memory entry (fact, preference, etc.)"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if memory already exists
            cursor.execute("""
                SELECT id FROM memory_entries
                WHERE personality_id = ? AND key = ? AND user_id = ?
            """, (personality_id, key, user_id))
            
            existing = cursor.fetchone()
            
            if existing:
                # Update existing memory
                cursor.execute("""
                    UPDATE memory_entries
                    SET value = ?, importance = ?, timestamp = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (value, importance, existing['id']))
            else:
                # Insert new memory
                cursor.execute("""
                    INSERT INTO memory_entries
                    (personality_id, user_id, key, value, importance)
                    VALUES (?, ?, ?, ?, ?)
                """, (personality_id, user_id, key, value, importance))
            
            conn.commit()
    
    def get_memory(
        self,
        personality_id: str,
        key: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get memory entries for a personality"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            if key:
                cursor.execute("""
                    SELECT * FROM memory_entries
                    WHERE personality_id = ? AND key = ? AND (user_id = ? OR user_id IS NULL)
                    ORDER BY importance DESC, timestamp DESC
                """, (personality_id, key, user_id))
            else:
                cursor.execute("""
                    SELECT * FROM memory_entries
                    WHERE personality_id = ? AND (user_id = ? OR user_id IS NULL)
                    ORDER BY importance DESC, timestamp DESC
                """, (personality_id, user_id))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def update_memory_access(self, memory_id: int):
        """Update memory access statistics"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE memory_entries
                SET last_accessed = CURRENT_TIMESTAMP,
                    access_count = access_count + 1
                WHERE id = ?
            """, (memory_id,))
            conn.commit()
    
    def get_context_for_personality(
        self,
        personality_id: str,
        user_id: Optional[str] = None,
        max_conversations: int = 20,
        max_memories: int = 10
    ) -> Dict[str, Any]:
        """Get full context (conversations + memories) for a personality"""
        conversations = self.get_conversation_history(
            personality_id, user_id, limit=max_conversations
        )
        memories = self.get_memory(personality_id, user_id=user_id)
        
        # Sort memories by importance and recency
        memories.sort(key=lambda x: (
            x.get('importance', 1.0),
            x.get('access_count', 0)
        ), reverse=True)
        
        return {
            "conversations": conversations[:max_conversations],
            "memories": memories[:max_memories],
            "total_conversations": len(conversations),
            "total_memories": len(memories)
        }
    
    def extract_and_save_memories(
        self,
        personality_id: str,
        conversation_text: str,
        user_id: Optional[str] = None
    ):
        """Extract important information from conversation and save as memories"""
        # This is a simple implementation - could be enhanced with AI extraction
        # For now, we'll save the conversation and let the AI learn from context
        
        # Common patterns to extract:
        # - User preferences
        # - Important facts mentioned
        # - User's name, location, etc.
        
        # This would ideally use an LLM to extract structured information
        # For now, we just save the conversation and it will be used as context
        pass
    
    def learn_from_conversation(
        self,
        personality_id: str,
        message: str,
        response: str,
        user_id: Optional[str] = None
    ):
        """Learn from a conversation and update memories"""
        # Save conversation
        self.save_conversation(personality_id, message, response, user_id)
        
        # Extract and save important information
        # This could be enhanced with AI to extract key facts, preferences, etc.
        self.extract_and_save_memories(personality_id, f"{message}\n{response}", user_id)
