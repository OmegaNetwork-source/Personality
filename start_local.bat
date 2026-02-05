@echo off
echo Starting CharacterOS locally...
echo.

REM Check if Ollama is running
curl http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo Starting Ollama service...
    start "" ollama serve
    timeout /t 3 /nobreak >nul
)

REM Start Backend
echo Starting Backend API...
cd backend
start "CharacterOS Backend" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo Starting Frontend...
cd ..\frontend
start "CharacterOS Frontend" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo CharacterOS is starting!
echo ========================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit (services will keep running)...
pause >nul
