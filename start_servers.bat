@echo off
REM Activate virtual environment
call "C:\Users\keysk\Desktop\project\project 2\Audit_verification_sys\venv\Scripts\activate.bat"

REM Start backend (FastAPI on port 8000)
start cmd /k "cd /d C:\Users\keysk\Desktop\project\project 2\Audit_verification_sys\backend && uvicorn auth_backend:app --reload --port 8000"

REM Start frontend (static server on port 5500)
start cmd /k "cd /d C:\Users\keysk\Desktop\project\project 2\Audit_verification_sys\frontend && python -m http.server 5500"

REM Wait a few seconds for servers to boot
timeout /t 5 >nul

REM Open the system in default browser
start http://127.0.0.1:5500/index.html

exit
