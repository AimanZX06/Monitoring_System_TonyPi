@echo off
REM SSH Terminal Feature - Dependency Installation Verification
REM This script checks if all required dependencies are installed

echo ============================================
echo SSH Terminal Feature - Dependency Check
echo ============================================
echo.

REM Check backend dependencies
echo Checking Backend Dependencies...
echo.

cd backend 2>nul
if errorlevel 1 (
    echo [ERROR] Backend directory not found
    exit /b 1
)

REM Check if requirements.txt has the dependencies
findstr /c:"asyncssh" requirements.txt >nul
if %errorlevel% equ 0 (
    echo [OK] asyncssh found in requirements.txt
) else (
    echo [FAIL] asyncssh NOT found in requirements.txt
)

findstr /c:"websockets" requirements.txt >nul
if %errorlevel% equ 0 (
    echo [OK] websockets found in requirements.txt
) else (
    echo [FAIL] websockets NOT found in requirements.txt
)

echo.
echo Checking if packages are installed...

python -c "import asyncssh" 2>nul
if %errorlevel% equ 0 (
    echo [OK] asyncssh is installed
) else (
    echo [WARNING] asyncssh is NOT installed - run: pip install -r requirements.txt
)

python -c "import websockets" 2>nul
if %errorlevel% equ 0 (
    echo [OK] websockets is installed
) else (
    echo [WARNING] websockets is NOT installed - run: pip install -r requirements.txt
)

REM Check if ssh.py router exists
if exist "routers\ssh.py" (
    echo [OK] SSH router ^(routers\ssh.py^) exists
) else (
    echo [FAIL] SSH router NOT found
)

cd ..

echo.
echo Checking Frontend Dependencies...
echo.

cd frontend 2>nul
if errorlevel 1 (
    echo [ERROR] Frontend directory not found
    exit /b 1
)

REM Check package.json
findstr /c:"xterm" package.json >nul
if %errorlevel% equ 0 (
    echo [OK] xterm found in package.json
) else (
    echo [FAIL] xterm NOT found in package.json
)

findstr /c:"xterm-addon-fit" package.json >nul
if %errorlevel% equ 0 (
    echo [OK] xterm-addon-fit found in package.json
) else (
    echo [FAIL] xterm-addon-fit NOT found in package.json
)

REM Check if node_modules exist
if exist "node_modules\xterm" (
    echo [OK] xterm is installed
) else (
    echo [WARNING] xterm is NOT installed - run: npm install
)

if exist "node_modules\xterm-addon-fit" (
    echo [OK] xterm-addon-fit is installed
) else (
    echo [WARNING] xterm-addon-fit is NOT installed - run: npm install
)

REM Check if components exist
if exist "src\components\SSHTerminal.tsx" (
    echo [OK] SSHTerminal component exists
) else (
    echo [FAIL] SSHTerminal component NOT found
)

if exist "src\components\SSHTerminalModal.tsx" (
    echo [OK] SSHTerminalModal component exists
) else (
    echo [FAIL] SSHTerminalModal component NOT found
)

cd ..

echo.
echo ============================================
echo Summary
echo ============================================
echo.
echo To install missing dependencies:
echo.
echo   Backend:
echo     cd backend
echo     pip install -r requirements.txt
echo.
echo   Frontend:
echo     cd frontend
echo     npm install
echo.
echo Then restart your services:
echo.
echo   Docker:
echo     docker-compose down
echo     docker-compose up -d --build
echo.
echo   Local:
echo     # Terminal 1 ^(Backend^)
echo     cd backend
echo     uvicorn main:app --reload --host 0.0.0.0 --port 8000
echo.
echo     # Terminal 2 ^(Frontend^)
echo     cd frontend
echo     npm start
echo.
echo For full documentation, see: SSH_TERMINAL_GUIDE.md
echo.

pause
