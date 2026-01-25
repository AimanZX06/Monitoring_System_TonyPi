# SSH Terminal Feature - Web-Based Robot Access

## Overview

The TonyPi Monitoring System now includes a **web-based SSH terminal** feature that allows you to access your Raspberry Pi 5 robots directly from the frontend UI. This eliminates the need for separate SSH clients and provides a seamless, browser-based terminal experience.

## Features

✅ **Browser-Based Terminal** - Full SSH terminal in your web browser using xterm.js  
✅ **WebSocket Communication** - Real-time bidirectional communication  
✅ **Multi-Robot Support** - Connect to any registered robot  
✅ **Secure Connection** - SSH credentials required for each session  
✅ **Terminal Emulation** - Full color support, cursor control, and command history  
✅ **Responsive** - Auto-resizing terminal that adapts to window size  
✅ **Connection Status** - Visual indicators for connection state  

## How to Use

### From the Robots Page

1. **Navigate to Robots Page**
   - Open the TonyPi monitoring system in your browser
   - Click on "Robots" in the navigation menu

2. **Select a Robot**
   - Find the robot you want to connect to
   - Click the **"SSH"** button on the robot card
   - OR click "Details" and then "Open SSH Terminal"

3. **Enter SSH Credentials**
   - A modal will appear asking for credentials
   - **Username**: Usually `pi` (default Raspberry Pi username)
   - **Password**: Your robot's SSH password
   - Click **"Connect"**

4. **Use the Terminal**
   - The terminal will connect to your robot
   - Type commands just like a regular SSH session
   - Press Ctrl+C to interrupt running commands
   - Use standard Linux commands

5. **Close the Session**
   - Click the **X** button in the terminal header
   - Or close the modal window
   - Connection will be automatically terminated

## Technical Architecture

### Backend Components

**File**: `backend/routers/ssh.py`

- **WebSocket Endpoint**: `/api/v1/ssh/connect/{robot_id}`
- **SSH Library**: `asyncssh` for asynchronous SSH connections
- **Features**:
  - WebSocket-based SSH proxy
  - Real-time bidirectional data forwarding
  - Terminal resize support
  - Automatic cleanup on disconnect

**Dependencies** (in `requirements.txt`):
```
asyncssh==2.14.2
websockets==12.0
```

### Frontend Components

**Files**:
- `frontend/src/components/SSHTerminal.tsx` - Terminal component
- `frontend/src/components/SSHTerminalModal.tsx` - Modal wrapper
- `frontend/src/pages/Robots.tsx` - Integration into UI

**Dependencies** (in `package.json`):
```json
"xterm": "^5.3.0",
"xterm-addon-fit": "^0.8.0"
```

### Communication Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │         │   Backend   │         │  Robot Pi   │
│   (xterm)   │         │  (FastAPI)  │         │    (SSH)    │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │                        │
      │  WebSocket Connect     │                        │
      │───────────────────────>│                        │
      │                        │  SSH Connect           │
      │                        │───────────────────────>│
      │                        │                        │
      │  Connected             │  SSH Session           │
      │<───────────────────────│<───────────────────────│
      │                        │                        │
      │  User Input            │  Forward to SSH        │
      │───────────────────────>│───────────────────────>│
      │                        │                        │
      │  Terminal Output       │  Forward from SSH      │
      │<───────────────────────│<───────────────────────│
      │                        │                        │
```

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install:
- `asyncssh` - Async SSH client library
- `websockets` - WebSocket support

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install:
- `xterm` - Terminal emulator for the browser
- `xterm-addon-fit` - Terminal auto-sizing addon

### 3. Restart Services

If using Docker:
```bash
docker-compose down
docker-compose up -d --build
```

If running locally:
```bash
# Backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm start
```

### 4. Configure Robot SSH Access

Ensure SSH is enabled on your Raspberry Pi:

```bash
# On the Raspberry Pi
sudo raspi-config
# Navigate to: Interfacing Options > SSH > Enable

# Or use command line
sudo systemctl enable ssh
sudo systemctl start ssh
```

## Security Considerations

### Best Practices

1. **Use Strong Passwords**
   - Change default Raspberry Pi password
   - Use unique passwords for each robot

2. **Network Security**
   - Keep robots on a trusted network
   - Use firewall rules to restrict SSH access
   - Consider VPN for remote access

3. **SSH Key Authentication** (Recommended)
   - Use SSH keys instead of passwords for production
   - Backend can be modified to support key-based auth

4. **Session Management**
   - Sessions automatically close on disconnect
   - No persistent connections when browser closes

### Production Recommendations

For production environments, consider:

1. **Add Authentication**
   - Require user login before SSH access
   - Log all SSH session attempts
   - Implement role-based access control

2. **Enable SSH Key Auth**
   - Modify backend to use SSH keys
   - Store keys securely (environment variables or secrets manager)

3. **Audit Logging**
   - Log all SSH commands executed
   - Track which users access which robots
   - Monitor for suspicious activity

4. **Rate Limiting**
   - Limit SSH connection attempts
   - Implement timeout for idle sessions

## Troubleshooting

### Connection Fails

**Issue**: "SSH connection failed"

**Solutions**:
1. Verify robot is online and IP address is correct
2. Check SSH credentials (username/password)
3. Ensure SSH service is running on robot:
   ```bash
   sudo systemctl status ssh
   ```
4. Check firewall isn't blocking port 22:
   ```bash
   sudo ufw status
   sudo ufw allow 22
   ```

### Terminal Not Displaying Properly

**Issue**: Terminal looks broken or characters are garbled

**Solutions**:
1. Refresh the browser
2. Close and reopen the SSH session
3. Check browser console for errors
4. Try a different browser (Chrome/Firefox recommended)

### Can't Type in Terminal

**Issue**: Terminal shows output but keyboard input doesn't work

**Solutions**:
1. Click inside the terminal area to focus it
2. Check if modal is fully loaded
3. Refresh and reconnect

### Robot IP Not Available

**Issue**: "Robot has no IP address"

**Solutions**:
1. Ensure robot is connected to the monitoring system
2. Robot must send MQTT heartbeat with IP address
3. Check robot client is running:
   ```bash
   # On robot
   python3 tonypi_client.py
   ```

## API Reference

### WebSocket Endpoint

```
ws://localhost:8000/api/v1/ssh/connect/{robot_id}
```

**Query Parameters**:
- `ssh_username` (required) - SSH username
- `ssh_password` (required) - SSH password

**Message Format**:

Client → Server:
```json
{"type": "input", "data": "ls -la\n"}
{"type": "resize", "cols": 120, "rows": 30}
```

Server → Client:
```json
{"type": "output", "data": "drwxr-xr-x 2 pi pi 4096...\n"}
{"type": "error", "message": "Connection failed"}
```

### REST Endpoint (Test Connection)

```
GET /api/v1/ssh/test/{robot_id}
```

**Query Parameters**:
- `ssh_username` - SSH username
- `ssh_password` - SSH password

**Response**:
```json
{
  "success": true,
  "message": "SSH connection successful",
  "robot_id": "tonypi_01",
  "robot_ip": "192.168.1.100"
}
```

## Future Enhancements

Planned improvements:

- [ ] SSH key-based authentication
- [ ] Session recording and playback
- [ ] Multi-session support (multiple robots simultaneously)
- [ ] File upload/download through terminal
- [ ] Copy/paste clipboard integration
- [ ] Dark/light theme toggle for terminal
- [ ] Command history across sessions
- [ ] Auto-reconnect on connection drop

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `docker logs monitoring_system_tonypi-backend-1`
3. Check browser console for frontend errors
4. Verify robot SSH service is accessible

---

**Happy SSH-ing! 🚀**
