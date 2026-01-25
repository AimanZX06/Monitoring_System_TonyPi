# SSH Terminal Feature - Installation Instructions

## 📦 Complete Installation Guide

Follow these steps to install and activate the SSH Terminal feature.

---

## Step 1: Install Backend Dependencies

The backend needs two new Python packages for SSH functionality.

### Option A: Using pip (Development)

```bash
cd backend
pip install asyncssh==2.14.2 websockets==12.0
```

Or install all dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### Option B: Using Docker (Recommended)

Dependencies will be installed automatically during Docker build:
```bash
docker-compose down
docker-compose up -d --build
```

### Verify Backend Installation

```bash
python -c "import asyncssh; print('asyncssh installed successfully')"
python -c "import websockets; print('websockets installed successfully')"
```

---

## Step 2: Install Frontend Dependencies

The frontend needs xterm.js for terminal emulation.

### Install via npm

```bash
cd frontend
npm install
```

This will install:
- `xterm@^5.3.0`
- `xterm-addon-fit@^0.8.0`

### Verify Frontend Installation

```bash
cd frontend
ls node_modules | grep xterm
```

You should see:
- `xterm`
- `xterm-addon-fit`

---

## Step 3: Restart Services

### Docker Deployment

```bash
# Stop all services
docker-compose down

# Rebuild and start with new dependencies
docker-compose up -d --build

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Local Development

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Wait for both services to start completely.

---

## Step 4: Verify Installation

### Automated Check

**Windows:**
```cmd
check_ssh_setup.bat
```

**Unix/Linux/Mac:**
```bash
chmod +x check_ssh_setup.sh
./check_ssh_setup.sh
```

### Manual Verification

1. **Check Backend API Documentation**
   - Open: http://localhost:8000/api/v1/docs
   - Look for "SSH Terminal" section
   - Should see endpoints:
     - `GET /api/v1/ssh/test/{robot_id}`
     - `WebSocket /api/v1/ssh/connect/{robot_id}`

2. **Check Frontend UI**
   - Open: http://localhost:3001
   - Go to "Robots" page
   - Each robot card should have an "SSH" button
   - Click on a robot's "Details"
   - Should see "Open SSH Terminal" button

---

## Step 5: Configure Robot SSH Access

Your Raspberry Pi must have SSH enabled.

### On the Raspberry Pi

1. **Enable SSH**
   ```bash
   sudo raspi-config
   # Navigate to: Interfacing Options > SSH > Enable
   ```

   Or via command line:
   ```bash
   sudo systemctl enable ssh
   sudo systemctl start ssh
   ```

2. **Verify SSH is Running**
   ```bash
   sudo systemctl status ssh
   ```

   Should show "active (running)"

3. **Check Firewall (if enabled)**
   ```bash
   sudo ufw status
   sudo ufw allow 22
   ```

4. **Find Robot IP Address**
   ```bash
   hostname -I
   ```

   Note this IP - it should match what's shown in the monitoring system.

### Test SSH from Command Line

Before using the web terminal, verify SSH works:

```bash
# From your computer
ssh pi@<robot-ip-address>
```

If this works, the web terminal should work too.

---

## Step 6: Test SSH Terminal

1. **Open Monitoring System**
   - Navigate to http://localhost:3001

2. **Go to Robots Page**
   - Click "Robots" in the menu

3. **Find Online Robot**
   - Look for a robot with status "online"
   - Should have an IP address

4. **Open SSH Terminal**
   - Click the "SSH" button on the robot card
   - OR click "Details" then "Open SSH Terminal"

5. **Enter Credentials**
   - Username: `pi` (default)
   - Password: Your robot's SSH password
   - Click "Connect"

6. **Test Commands**
   ```bash
   # Should see the terminal prompt
   pi@tonypi:~ $
   
   # Try some commands
   pwd
   ls -la
   uname -a
   hostname
   ```

7. **Close Session**
   - Click the X button
   - Or type `exit` and press Enter

---

## Troubleshooting Installation

### Backend Issues

**Error: "ModuleNotFoundError: No module named 'asyncssh'"**

Solution:
```bash
cd backend
pip install asyncssh websockets
```

**Error: "ImportError: cannot import name 'router' from 'routers.ssh'"**

Solution:
- Verify `backend/routers/ssh.py` exists
- Check file has no syntax errors
- Restart backend service

### Frontend Issues

**Error: "Cannot find module 'xterm'"**

Solution:
```bash
cd frontend
npm install xterm xterm-addon-fit
npm start
```

**Error: "Module not found: Can't resolve './components/SSHTerminal'"**

Solution:
- Verify `frontend/src/components/SSHTerminal.tsx` exists
- Verify `frontend/src/components/SSHTerminalModal.tsx` exists
- Restart frontend dev server

### Docker Issues

**Error: "Backend container exits immediately"**

Solution:
```bash
docker-compose logs backend
# Check for Python import errors
# Rebuild if needed
docker-compose build --no-cache backend
docker-compose up -d
```

**Error: "Frontend shows 'Waiting for backend'"**

Solution:
```bash
# Check backend is running
docker ps

# Check backend logs
docker-compose logs backend

# Restart if needed
docker-compose restart backend
```

### SSH Connection Issues

**Error: "SSH connection failed"**

Checklist:
- [ ] Robot is online (check status in UI)
- [ ] Robot has IP address (shown in UI)
- [ ] SSH credentials are correct
- [ ] SSH service is running on robot:
  ```bash
  # On robot
  sudo systemctl status ssh
  ```
- [ ] Firewall allows SSH (port 22)
- [ ] Can SSH from terminal:
  ```bash
  ssh pi@<robot-ip>
  ```

**Error: "Robot has no IP address"**

Solution:
- Wait for robot to connect and send MQTT data
- Check robot client is running
- Verify MQTT broker is accessible
- Check network connectivity

---

## Environment-Specific Notes

### Windows

- Use PowerShell or Command Prompt
- Path separators: Use `\` or `\\` in batch files
- Run `check_ssh_setup.bat` to verify

### Linux/Mac

- Use Terminal or Bash
- Path separators: Use `/`
- May need `sudo` for some commands
- Run `./check_ssh_setup.sh` to verify

### Docker

- All dependencies auto-installed
- No manual installation needed
- Just rebuild containers
- Check with: `docker-compose logs`

---

## Post-Installation

### Security Recommendations

1. **Change Default Password**
   ```bash
   # On robot
   passwd
   ```

2. **Consider SSH Keys**
   - More secure than passwords
   - Backend can be modified to support key auth

3. **Restrict Access**
   - Use firewall rules
   - Consider VPN for remote access
   - Implement user authentication

### Performance Optimization

1. **Backend**
   - Adjust worker count in uvicorn
   - Monitor memory usage
   - Set connection timeouts

2. **Frontend**
   - Use production build for deployment:
     ```bash
     npm run build
     ```

3. **Network**
   - Ensure low latency to robots
   - Use wired connection when possible
   - Monitor WebSocket connection stability

---

## Getting Help

If you encounter issues:

1. **Check Documentation**
   - [SSH_TERMINAL_GUIDE.md](SSH_TERMINAL_GUIDE.md) - Complete guide
   - [SSH_QUICK_REFERENCE.md](SSH_QUICK_REFERENCE.md) - Quick commands
   - [SSH_FEATURE_SUMMARY.md](SSH_FEATURE_SUMMARY.md) - Implementation details

2. **Run Verification**
   - `check_ssh_setup.bat` (Windows)
   - `./check_ssh_setup.sh` (Unix/Linux/Mac)

3. **Check Logs**
   - Backend: `docker-compose logs backend`
   - Frontend: Browser console (F12)
   - Robot: `journalctl -u tonypi-robot.service`

4. **Test Components**
   - Backend API: http://localhost:8000/api/v1/docs
   - Frontend UI: http://localhost:3001
   - SSH directly: `ssh pi@<robot-ip>`

---

## Success Checklist

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Services restarted
- [ ] SSH endpoint appears in API docs
- [ ] SSH buttons visible in UI
- [ ] Can open SSH terminal modal
- [ ] Can enter credentials
- [ ] Terminal connects successfully
- [ ] Can execute commands
- [ ] Terminal output displays
- [ ] Can close session cleanly

---

**Installation Complete! 🎉**

You can now access your robots via SSH directly from the web interface!

Next steps:
- Read [SSH_QUICK_REFERENCE.md](SSH_QUICK_REFERENCE.md) for common commands
- Review [SSH_TERMINAL_GUIDE.md](SSH_TERMINAL_GUIDE.md) for advanced usage
- Check security recommendations before production deployment
