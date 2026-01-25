#!/bin/bash
# SSH Terminal Feature - Dependency Installation Verification
# This script checks if all required dependencies are installed

echo "============================================"
echo "SSH Terminal Feature - Dependency Check"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check backend dependencies
echo "📦 Checking Backend Dependencies..."
echo ""

cd backend 2>/dev/null || { echo -e "${RED}❌ Backend directory not found${NC}"; exit 1; }

# Check if requirements.txt has the dependencies
if grep -q "asyncssh" requirements.txt; then
    echo -e "${GREEN}✓ asyncssh found in requirements.txt${NC}"
else
    echo -e "${RED}✗ asyncssh NOT found in requirements.txt${NC}"
fi

if grep -q "websockets" requirements.txt; then
    echo -e "${GREEN}✓ websockets found in requirements.txt${NC}"
else
    echo -e "${RED}✗ websockets NOT found in requirements.txt${NC}"
fi

# Check if packages are installed
echo ""
echo "Checking if packages are installed..."

if python3 -c "import asyncssh" 2>/dev/null; then
    echo -e "${GREEN}✓ asyncssh is installed${NC}"
else
    echo -e "${YELLOW}⚠ asyncssh is NOT installed - run: pip install -r requirements.txt${NC}"
fi

if python3 -c "import websockets" 2>/dev/null; then
    echo -e "${GREEN}✓ websockets is installed${NC}"
else
    echo -e "${YELLOW}⚠ websockets is NOT installed - run: pip install -r requirements.txt${NC}"
fi

# Check if ssh.py router exists
if [ -f "routers/ssh.py" ]; then
    echo -e "${GREEN}✓ SSH router (routers/ssh.py) exists${NC}"
else
    echo -e "${RED}✗ SSH router NOT found${NC}"
fi

cd ..

echo ""
echo "📦 Checking Frontend Dependencies..."
echo ""

cd frontend 2>/dev/null || { echo -e "${RED}❌ Frontend directory not found${NC}"; exit 1; }

# Check package.json
if grep -q "xterm" package.json; then
    echo -e "${GREEN}✓ xterm found in package.json${NC}"
else
    echo -e "${RED}✗ xterm NOT found in package.json${NC}"
fi

if grep -q "xterm-addon-fit" package.json; then
    echo -e "${GREEN}✓ xterm-addon-fit found in package.json${NC}"
else
    echo -e "${RED}✗ xterm-addon-fit NOT found in package.json${NC}"
fi

# Check if node_modules exist
if [ -d "node_modules/xterm" ]; then
    echo -e "${GREEN}✓ xterm is installed${NC}"
else
    echo -e "${YELLOW}⚠ xterm is NOT installed - run: npm install${NC}"
fi

if [ -d "node_modules/xterm-addon-fit" ]; then
    echo -e "${GREEN}✓ xterm-addon-fit is installed${NC}"
else
    echo -e "${YELLOW}⚠ xterm-addon-fit is NOT installed - run: npm install${NC}"
fi

# Check if components exist
if [ -f "src/components/SSHTerminal.tsx" ]; then
    echo -e "${GREEN}✓ SSHTerminal component exists${NC}"
else
    echo -e "${RED}✗ SSHTerminal component NOT found${NC}"
fi

if [ -f "src/components/SSHTerminalModal.tsx" ]; then
    echo -e "${GREEN}✓ SSHTerminalModal component exists${NC}"
else
    echo -e "${RED}✗ SSHTerminalModal component NOT found${NC}"
fi

cd ..

echo ""
echo "============================================"
echo "📋 Summary"
echo "============================================"
echo ""
echo "To install missing dependencies:"
echo ""
echo "  Backend:"
echo "    cd backend"
echo "    pip install -r requirements.txt"
echo ""
echo "  Frontend:"
echo "    cd frontend"
echo "    npm install"
echo ""
echo "Then restart your services:"
echo ""
echo "  Docker:"
echo "    docker-compose down"
echo "    docker-compose up -d --build"
echo ""
echo "  Local:"
echo "    # Terminal 1 (Backend)"
echo "    cd backend"
echo "    uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "    # Terminal 2 (Frontend)"
echo "    cd frontend"
echo "    npm start"
echo ""
echo "For full documentation, see: SSH_TERMINAL_GUIDE.md"
echo ""
