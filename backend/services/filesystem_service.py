"""
File System Service - Allows AI agent to interact with files
Limited to user-selected folder for security
"""
import os
import json
from typing import Dict, Any, List, Optional
from pathlib import Path
import subprocess
import asyncio

class FileSystemService:
    def __init__(self, base_folder: Optional[str] = None):
        self.base_folder = Path(base_folder) if base_folder else None
        if self.base_folder:
            self.base_folder.mkdir(parents=True, exist_ok=True)
    
    def set_base_folder(self, folder_path: str):
        """Set the base folder for file operations"""
        self.base_folder = Path(folder_path)
        self.base_folder.mkdir(parents=True, exist_ok=True)
    
    def _validate_path(self, file_path: str) -> Path:
        """Validate that path is within base folder"""
        if not self.base_folder:
            raise ValueError("No base folder set. User must select a folder first.")
        
        full_path = (self.base_folder / file_path).resolve()
        base_resolved = self.base_folder.resolve()
        
        # Security: Ensure path is within base folder
        try:
            full_path.relative_to(base_resolved)
        except ValueError:
            raise PermissionError(f"Access denied: Path outside selected folder")
        
        return full_path
    
    async def read_file(self, file_path: str) -> Dict[str, Any]:
        """Read a file"""
        try:
            full_path = self._validate_path(file_path)
            content = full_path.read_text(encoding='utf-8')
            return {
                "success": True,
                "content": content,
                "path": str(full_path)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def write_file(self, file_path: str, content: str) -> Dict[str, Any]:
        """Write to a file (creates if doesn't exist)"""
        try:
            full_path = self._validate_path(file_path)
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content, encoding='utf-8')
            return {
                "success": True,
                "path": str(full_path)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def create_file(self, file_path: str, content: str = "") -> Dict[str, Any]:
        """Create a new file"""
        return await self.write_file(file_path, content)
    
    async def delete_file(self, file_path: str) -> Dict[str, Any]:
        """Delete a file or directory"""
        try:
            full_path = self._validate_path(file_path)
            if full_path.is_dir():
                import shutil
                shutil.rmtree(full_path)
            else:
                full_path.unlink()
            return {"success": True}
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def list_directory(self, dir_path: str = "") -> Dict[str, Any]:
        """List files and directories"""
        try:
            full_path = self._validate_path(dir_path) if dir_path else self.base_folder
            
            if not full_path.exists():
                return {"success": False, "error": "Directory does not exist"}
            
            items = []
            for item in full_path.iterdir():
                stat = item.stat()
                items.append({
                    "name": item.name,
                    "path": str(item.relative_to(self.base_folder)),
                    "type": "directory" if item.is_dir() else "file",
                    "size": stat.st_size,
                    "modified": stat.st_mtime
                })
            
            return {
                "success": True,
                "items": items
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def execute_command(
        self,
        command: str,
        args: List[str] = None,
        cwd: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute a command in the base folder"""
        try:
            working_dir = self.base_folder
            if cwd:
                working_dir = self._validate_path(cwd)
                if not working_dir.is_dir():
                    return {"success": False, "error": "Working directory is not a directory"}
            
            process = await asyncio.create_subprocess_exec(
                command,
                *(args or []),
                cwd=str(working_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            return {
                "success": process.returncode == 0,
                "exitCode": process.returncode,
                "stdout": stdout.decode('utf-8', errors='ignore'),
                "stderr": stderr.decode('utf-8', errors='ignore')
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def troubleshoot_file(self, file_path: str) -> Dict[str, Any]:
        """Analyze a file for issues and suggest fixes"""
        try:
            result = await self.read_file(file_path)
            if not result["success"]:
                return {
                    "success": False,
                    "issue": "File not found or cannot be read",
                    "suggestion": "Check if file exists and has proper permissions"
                }
            
            content = result["content"]
            issues = []
            suggestions = []
            
            # Check for common issues
            if not content.strip():
                issues.append("File is empty")
                suggestions.append("File may need content")
            
            # Check for syntax errors in common file types
            if file_path.endswith('.json'):
                try:
                    json.loads(content)
                except json.JSONDecodeError as e:
                    issues.append(f"Invalid JSON: {str(e)}")
                    suggestions.append("Fix JSON syntax errors")
            
            if file_path.endswith('.py'):
                # Check for Python syntax errors
                try:
                    compile(content, file_path, 'exec')
                except SyntaxError as e:
                    issues.append(f"Python syntax error: {str(e)}")
                    suggestions.append(f"Fix syntax at line {e.lineno}")
            
            return {
                "success": True,
                "issues": issues,
                "suggestions": suggestions,
                "filePath": file_path
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def auto_fix_file(self, file_path: str) -> Dict[str, Any]:
        """Attempt to automatically fix common issues in a file"""
        try:
            troubleshoot_result = await self.troubleshoot_file(file_path)
            
            if not troubleshoot_result.get("success") or not troubleshoot_result.get("issues"):
                return {
                    "success": True,
                    "message": "No issues found or file cannot be accessed",
                    "fixed": False
                }
            
            issues = troubleshoot_result["issues"]
            content_result = await self.read_file(file_path)
            
            if not content_result["success"]:
                return troubleshoot_result
            
            content = content_result["content"]
            fixed_content = content
            fixes_applied = []
            
            # Auto-fix JSON
            if file_path.endswith('.json') and any("JSON" in issue for issue in issues):
                try:
                    # Try to parse and reformat
                    data = json.loads(content)
                    fixed_content = json.dumps(data, indent=2)
                    fixes_applied.append("Reformatted JSON")
                except:
                    pass
            
            # Auto-fix common Python issues
            if file_path.endswith('.py'):
                # Remove trailing whitespace
                lines = fixed_content.split('\n')
                fixed_lines = [line.rstrip() for line in lines]
                if fixed_lines != lines:
                    fixes_applied.append("Removed trailing whitespace")
                    fixed_content = '\n'.join(fixed_lines)
            
            if fixes_applied:
                await self.write_file(file_path, fixed_content)
                return {
                    "success": True,
                    "fixed": True,
                    "fixes": fixes_applied,
                    "message": f"Applied {len(fixes_applied)} fix(es)"
                }
            else:
                return {
                    "success": True,
                    "fixed": False,
                    "message": "Issues detected but no automatic fixes available"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
