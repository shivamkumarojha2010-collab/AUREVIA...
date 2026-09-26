@echo off
title AUREVIA - Distributed Object Storage
cd /d "%~dp0"
if not exist "venv\Scripts\python.exe" (
  echo Creating virtual environment...
  python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing required packages...
python -m pip install -r backend\requirements.txt
echo.
echo Starting AUREVIA...
echo Private sign-in is enabled.
if defined GOOGLE_CLIENT_ID echo Google Sign-In is enabled.
echo Open http://127.0.0.1:8000
echo Press CTRL+C to stop the server.
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
pause
