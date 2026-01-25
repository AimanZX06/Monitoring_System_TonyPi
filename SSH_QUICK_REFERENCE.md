# SSH Terminal - Quick Reference

## 🚀 Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Restart Services

**Docker:**
```bash
docker-compose down
docker-compose up -d --build
```

**Local:**
```bash
# Terminal 1 - Backend
cd backend && uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend && npm start
```

### 3. Access SSH Terminal

1. Go to **Robots** page
2. Click **SSH** button on any robot card
3. Enter credentials:
   - Username: `pi`
   - Password: *your robot password*
4. Click **Connect**

---

## 📝 Default Credentials

Most Raspberry Pi systems use:
- **Username**: `pi`
- **Password**: `raspberry` (or your custom password)

**⚠️ Security Tip**: Change the default password on your robot!
```bash
passwd
```

---

## 🔧 Common Commands

```bash
# System info
uname -a
hostname -I          # Show IP addresses
df -h                # Disk usage
free -h              # Memory usage

# Process management
top                  # Interactive process viewer (q to quit)
htop                 # Better process viewer (if installed)
ps aux               # List all processes

# Robot client
cd ~/monitoring/robot_client
python3 tonypi_client.py

# Logs
journalctl -u tonypi-robot.service -f    # Follow robot logs
tail -f /var/log/syslog                  # System logs

# Network
ifconfig             # Network interfaces
ping google.com      # Test connectivity
netstat -tuln        # Show listening ports

# Camera
raspistill -o test.jpg     # Capture image
raspivid -o test.h264 -t 10000  # Record 10s video
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection fails | Check robot is online, verify IP, check SSH service: `sudo systemctl status ssh` |
| Wrong password | Use correct SSH password (not web UI password) |
| Terminal garbled | Refresh browser, close and reconnect |
| Can't type | Click inside terminal window to focus |
| Slow response | Check network latency, robot CPU usage |

---

## 🔐 Security Checklist

- [ ] Changed default `pi` password
- [ ] Using strong unique passwords
- [ ] Robots on trusted network only
- [ ] Firewall configured on robots
- [ ] Consider SSH key authentication for production

---

## 📁 Files Added/Modified

**Backend:**
- ✅ `backend/routers/ssh.py` - SSH WebSocket router
- ✅ `backend/requirements.txt` - Added asyncssh, websockets
- ✅ `backend/main.py` - Registered SSH router

**Frontend:**
- ✅ `frontend/src/components/SSHTerminal.tsx` - Terminal component
- ✅ `frontend/src/components/SSHTerminalModal.tsx` - Modal wrapper
- ✅ `frontend/src/pages/Robots.tsx` - Added SSH buttons
- ✅ `frontend/package.json` - Added xterm packages

**Documentation:**
- ✅ `SSH_TERMINAL_GUIDE.md` - Complete guide
- ✅ `SSH_FEATURE_SUMMARY.md` - Implementation summary
- ✅ `check_ssh_setup.sh` / `.bat` - Setup verification

---

## 🌐 API Endpoints

### WebSocket
```
ws://localhost:8000/api/v1/ssh/connect/{robot_id}
  ?ssh_username=pi&ssh_password=yourpassword
```

### REST (Test Connection)
```
GET /api/v1/ssh/test/{robot_id}
  ?ssh_username=pi&ssh_password=yourpassword
```

---

## 📚 Documentation

- **Full Guide**: [SSH_TERMINAL_GUIDE.md](SSH_TERMINAL_GUIDE.md)
- **Summary**: [SSH_FEATURE_SUMMARY.md](SSH_FEATURE_SUMMARY.md)
- **Main README**: [README.md](README.md)

---

## ✅ Verification

Run setup check:
```bash
# Windows
check_ssh_setup.bat

# Unix/Linux/Mac
./check_ssh_setup.sh
```

---

## 💡 Tips

- **Keyboard Shortcuts**:
  - `Ctrl+C` - Interrupt command
  - `Ctrl+Z` - Suspend process
  - `Ctrl+D` - Exit/logout
  - `Tab` - Auto-complete
  - `↑`/`↓` - Command history

- **Useful Aliases** (add to `~/.bashrc`):
  ```bash
  alias ll='ls -lah'
  alias ports='netstat -tuln'
  alias temp='vcgencmd measure_temp'
  ```

- **Exit Terminal**: Type `exit` or click the X button

---

**Need Help?** See [SSH_TERMINAL_GUIDE.md](SSH_TERMINAL_GUIDE.md) for detailed troubleshooting!
