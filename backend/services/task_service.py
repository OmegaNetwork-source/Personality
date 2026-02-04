"""
Task Service - Autonomous task execution for 24/7 operation
Inspired by OpenClaw's task automation system
"""
import json
import os
import asyncio
from typing import Dict, Any, List, Optional, Callable
from pathlib import Path
from datetime import datetime, timedelta
from croniter import croniter
import sqlite3
from contextlib import contextmanager

class TaskService:
    def __init__(self, memory_service=None, ollama_service=None):
        self.memory_service = memory_service
        self.ollama_service = ollama_service
        self.tasks_dir = Path(os.getenv("TASKS_DIR", "./tasks"))
        self.tasks_dir.mkdir(exist_ok=True)
        self.running = False
        self.task_handlers = {}
        
        # Register default task handlers
        self._register_default_handlers()
    
    def _register_default_handlers(self):
        """Register default task handlers"""
        self.register_handler("chat", self._handle_chat_task)
        self.register_handler("web_search", self._handle_web_search_task)
        self.register_handler("crypto_price", self._handle_crypto_price_task)
        self.register_handler("reminder", self._handle_reminder_task)
        self.register_handler("custom", self._handle_custom_task)
    
    def register_handler(self, task_type: str, handler: Callable):
        """Register a task handler"""
        self.task_handlers[task_type] = handler
    
    @contextmanager
    def _get_connection(self):
        """Get database connection"""
        db_path = self.memory_service.memory_dir / "memory.db" if self.memory_service else Path("./memory/memory.db")
        db_path.parent.mkdir(exist_ok=True)
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    def create_task(
        self,
        personality_id: str,
        task_type: str,
        task_data: Dict[str, Any],
        schedule: Optional[str] = None,  # Cron expression or "once", "daily", "hourly"
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new autonomous task"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Calculate next run time
            next_run = self._calculate_next_run(schedule)
            
            cursor.execute("""
                INSERT INTO tasks
                (personality_id, user_id, task_type, task_data, schedule, next_run)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                personality_id,
                user_id,
                task_type,
                json.dumps(task_data),
                schedule,
                next_run
            ))
            
            task_id = cursor.lastrowid
            conn.commit()
            
            return {
                "id": task_id,
                "personality_id": personality_id,
                "task_type": task_type,
                "task_data": task_data,
                "schedule": schedule,
                "next_run": next_run,
                "status": "pending"
            }
    
    def _calculate_next_run(self, schedule: Optional[str]) -> Optional[str]:
        """Calculate next run time from schedule"""
        if not schedule:
            return None
        
        now = datetime.now()
        
        if schedule == "once":
            return now.isoformat()
        elif schedule == "daily":
            return (now + timedelta(days=1)).replace(hour=0, minute=0, second=0).isoformat()
        elif schedule == "hourly":
            return (now + timedelta(hours=1)).isoformat()
        elif schedule == "every_5_minutes":
            return (now + timedelta(minutes=5)).isoformat()
        else:
            # Try to parse as cron expression
            try:
                cron = croniter(schedule, now)
                next_run = cron.get_next(datetime)
                return next_run.isoformat()
            except:
                # Default to daily if cron parsing fails
                return (now + timedelta(days=1)).isoformat()
    
    def get_tasks(
        self,
        personality_id: Optional[str] = None,
        status: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get tasks"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            query = "SELECT * FROM tasks WHERE 1=1"
            params = []
            
            if personality_id:
                query += " AND personality_id = ?"
                params.append(personality_id)
            
            if status:
                query += " AND status = ?"
                params.append(status)
            
            if user_id:
                query += " AND user_id = ?"
                params.append(user_id)
            
            query += " ORDER BY next_run ASC"
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def update_task_status(self, task_id: int, status: str, result: Optional[str] = None):
        """Update task status"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            update_query = "UPDATE tasks SET status = ?, last_run = CURRENT_TIMESTAMP, run_count = run_count + 1"
            params = [status]
            
            if result:
                update_query += ", result = ?"
                params.append(result)
            
            # Calculate next run if task is recurring
            cursor.execute("SELECT schedule FROM tasks WHERE id = ?", (task_id,))
            task = cursor.fetchone()
            if task and task['schedule'] and status == "completed":
                next_run = self._calculate_next_run(task['schedule'])
                if next_run:
                    update_query += ", next_run = ?"
                    params.append(next_run)
            
            update_query += " WHERE id = ?"
            params.append(task_id)
            
            cursor.execute(update_query, params)
            conn.commit()
    
    async def _handle_chat_task(self, task: Dict[str, Any]) -> str:
        """Handle chat task - send a message and get response"""
        task_data = json.loads(task['task_data'])
        message = task_data.get('message', '')
        personality_id = task['personality_id']
        
        if not self.ollama_service:
            return "Ollama service not available"
        
        # Get personality
        from services.personality_service import PersonalityService
        personality_service = PersonalityService()
        personality = personality_service.get_personality(personality_id)
        
        # Get context from memory
        context = None
        if self.memory_service:
            memory_context = self.memory_service.get_context_for_personality(
                personality_id, user_id=task.get('user_id')
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
                user_id=task.get('user_id'),
                channel="autonomous_task"
            )
        
        return response_text
    
    async def _handle_web_search_task(self, task: Dict[str, Any]) -> str:
        """Handle web search task"""
        task_data = json.loads(task['task_data'])
        query = task_data.get('query', '')
        
        # This would use the brave_service
        # For now, return placeholder
        return f"Web search for: {query}"
    
    async def _handle_crypto_price_task(self, task: Dict[str, Any]) -> str:
        """Handle crypto price check task"""
        task_data = json.loads(task['task_data'])
        coin = task_data.get('coin', 'bitcoin')
        
        # This would use the coingecko_service
        # For now, return placeholder
        return f"Crypto price check for: {coin}"
    
    async def _handle_reminder_task(self, task: Dict[str, Any]) -> str:
        """Handle reminder task"""
        task_data = json.loads(task['task_data'])
        reminder_text = task_data.get('text', '')
        
        return f"Reminder: {reminder_text}"
    
    async def _handle_custom_task(self, task: Dict[str, Any]) -> str:
        """Handle custom task"""
        task_data = json.loads(task['task_data'])
        action = task_data.get('action', '')
        
        return f"Custom task executed: {action}"
    
    async def execute_task(self, task: Dict[str, Any]) -> str:
        """Execute a task"""
        task_type = task['task_type']
        handler = self.task_handlers.get(task_type)
        
        if not handler:
            return f"Unknown task type: {task_type}"
        
        try:
            result = await handler(task)
            return result
        except Exception as e:
            return f"Task execution error: {str(e)}"
    
    async def run_scheduler(self):
        """Run the task scheduler (24/7 operation)"""
        self.running = True
        print("[TaskService] Starting 24/7 task scheduler...")
        
        while self.running:
            try:
                # Get tasks that need to run
                now = datetime.now().isoformat()
                
                with self._get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        SELECT * FROM tasks
                        WHERE status = 'pending' 
                        AND next_run <= ?
                        ORDER BY next_run ASC
                    """, (now,))
                    
                    tasks = [dict(row) for row in cursor.fetchall()]
                
                # Execute tasks
                for task in tasks:
                    print(f"[TaskService] Executing task {task['id']}: {task['task_type']}")
                    self.update_task_status(task['id'], "running")
                    
                    try:
                        result = await self.execute_task(task)
                        self.update_task_status(task['id'], "completed", result)
                        print(f"[TaskService] Task {task['id']} completed: {result[:100]}")
                    except Exception as e:
                        self.update_task_status(task['id'], "failed", str(e))
                        print(f"[TaskService] Task {task['id']} failed: {e}")
                
                # Sleep for 1 minute before checking again
                await asyncio.sleep(60)
                
            except Exception as e:
                print(f"[TaskService] Scheduler error: {e}")
                await asyncio.sleep(60)
    
    def stop_scheduler(self):
        """Stop the task scheduler"""
        self.running = False
        print("[TaskService] Stopping task scheduler...")
