@echo off
echo ============================================
echo  Dental Marketing Dashboard - Maple Ridge
echo ============================================
echo.

set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%NODE_PATH%;%PATH%"

if not exist "backend\.env" (
  echo ERROR: Missing backend\.env file!
  echo Please copy .env.example to backend\.env and add your ANTHROPIC_API_KEY
  echo.
  pause
  exit /b 1
)

echo Starting backend server...
start "Backend - FastAPI" cmd /k "set PATH=%NODE_PATH%;%PATH% && cd /d %~dp0backend && .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak > nul

echo Starting frontend dev server...
start "Frontend - Vite" cmd /k "set PATH=%NODE_PATH%;%PATH% && cd /d %~dp0frontend && npm run dev"

timeout /t 4 /nobreak > nul

echo Opening dashboard in browser...
start http://localhost:5173

echo.
echo Dashboard is starting up!
echo Backend API: http://localhost:8000
echo Frontend:    http://localhost:5173
echo API Docs:    http://localhost:8000/docs
echo.
