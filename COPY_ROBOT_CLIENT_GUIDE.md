# How to Copy Robot Client to Raspberry Pi (Windows)

This guide shows you how to copy `robot_client/tonypi_client.py` to your Raspberry Pi from Windows.

---

## 🚀 Quick Method: Use the Batch Script

**Easiest way:**

1. Open Command Prompt (CMD) or PowerShell
2. Navigate to project directory:
   ```cmd
   cd C:\Users\aiman\Projects\Monitoring_System_TonyPi
   ```
3. Run the batch script:
   ```cmd
   copy_robot_client.bat 192.168.1.100
   ```
   (Replace `192.168.1.100` with your Raspberry Pi's IP address)

---

## 📋 Method 1: PowerShell (Recommended)

**If you have OpenSSH Client installed (Windows 10/11 usually has it):**

### Step 1: Open PowerShell
- Press `Win + X` → Select "Windows PowerShell" or "Terminal"
- Or search for "PowerShell" in Start menu

### Step 2: Navigate to Project
```powershell
cd C:\Users\aiman\Projects\Monitoring_System_TonyPi
```

### Step 3: Copy File
```powershell
scp robot_client\tonypi_client.py pi@192.168.1.100:/home/pi/robot_client/
```

**Replace:**
- `192.168.1.100` with your Raspberry Pi's IP address
- `pi` with your Raspberry Pi username (if different)

### Step 4: Enter Password
When prompted, enter your Raspberry Pi password.

---

## 📋 Method 2: Use PowerShell Script

**Even easier - use the provided script:**

```powershell
# Navigate to project
cd C:\Users\aiman\Projects\Monitoring_System_TonyPi

# Run script
powershell -ExecutionPolicy Bypass -File copy_robot_client.ps1 -RobotIP 192.168.1.100
```

---

## 📋 Method 3: Check if scp is Available

**First, check if `scp` is installed:**

### In PowerShell:
```powershell
where.exe scp
```

### In CMD:
```cmd
where scp
```

**If it says "not found", install OpenSSH Client:**

1. Open **Windows Settings** (Win + I)
2. Go to **Apps** → **Optional Features**
3. Click **"Add a feature"**
4. Search for **"OpenSSH Client"**
5. Click **Install**
6. Restart your terminal

---

## 📋 Method 4: Use WinSCP (GUI Tool)

**If you prefer a graphical interface:**

1. **Download WinSCP:**
   - Visit: https://winscp.net/
   - Download and install

2. **Connect to Raspberry Pi:**
   - Host name: `192.168.1.100` (your Pi's IP)
   - Username: `pi`
   - Password: (your Pi password)
   - Protocol: SFTP

3. **Copy File:**
   - Navigate to `robot_client` folder on left (your PC)
   - Navigate to `/home/pi/robot_client/` on right (Pi)
   - Drag `tonypi_client.py` from left to right

---

## 📋 Method 5: Use Git Bash (If Installed)

**If you have Git for Windows installed:**

1. Open **Git Bash**
2. Navigate to project:
   ```bash
   cd /c/Users/aiman/Projects/Monitoring_System_TonyPi
   ```
3. Copy file:
   ```bash
   scp robot_client/tonypi_client.py pi@192.168.1.100:/home/pi/robot_client/
   ```

---

## 📋 Method 6: Manual Copy (Fallback)

**If none of the above work:**

1. **On Raspberry Pi:**
   ```bash
   mkdir -p /home/pi/robot_client
   ```

2. **On Windows:**
   - Open File Explorer
   - Navigate to: `C:\Users\aiman\Projects\Monitoring_System_TonyPi\robot_client`
   - Copy `tonypi_client.py`

3. **Transfer via USB/Network Share:**
   - Use a USB drive, or
   - Set up a network share, or
   - Use a cloud service (Google Drive, Dropbox, etc.)

4. **On Raspberry Pi:**
   - Download/copy the file to `/home/pi/robot_client/`

---

## 🔍 Find Your Raspberry Pi IP Address

**If you don't know your Pi's IP:**

### On Raspberry Pi:
```bash
hostname -I
# or
ip addr show
```

### On Windows (if Pi is on same network):
```cmd
arp -a | findstr "b8:27:eb"
```
(Look for Raspberry Pi MAC address prefix)

---

## ✅ Verify Copy Worked

**After copying, SSH into Raspberry Pi and verify:**

```bash
ssh pi@192.168.1.100
cd /home/pi/robot_client/
ls -la tonypi_client.py
```

**You should see the file listed.**

---

## 🚀 Next Steps After Copying

1. **SSH into Raspberry Pi:**
   ```bash
   ssh pi@192.168.1.100
   ```

2. **Navigate to robot_client directory:**
   ```bash
   cd /home/pi/robot_client/
   ```

3. **Stop old client (if running):**
   ```bash
   # Press Ctrl+C if running in terminal
   # Or find and kill process:
   pkill -f tonypi_client.py
   ```

4. **Start new client:**
   ```bash
   python3 tonypi_client.py --broker YOUR_PC_IP --port 1883
   ```
   
   **Replace `YOUR_PC_IP` with your Windows PC's IP address:**
   - Find it: `ipconfig` in CMD → Look for IPv4 address

5. **Check logs:**
   - Should see "Sent servo status" messages
   - Should see servo data being read

---

## 🐛 Troubleshooting

### "scp: command not found"
- **Solution:** Install OpenSSH Client (see Method 3)

### "Permission denied"
- **Solution:** Make sure you're using correct username/password
- Try: `ssh pi@192.168.1.100` first to test connection

### "Connection refused"
- **Solution:** 
  - Check Pi is powered on
  - Check IP address is correct
  - Check Pi is on same network
  - Enable SSH on Pi: `sudo systemctl enable ssh`

### "No such file or directory"
- **Solution:** Create directory first:
  ```bash
  ssh pi@192.168.1.100 "mkdir -p /home/pi/robot_client"
  ```

---

## 📝 Example Full Workflow

```cmd
REM 1. Open CMD in project directory
cd C:\Users\aiman\Projects\Monitoring_System_TonyPi

REM 2. Use batch script (easiest)
copy_robot_client.bat 192.168.1.100

REM 3. Or use PowerShell directly
powershell
scp robot_client\tonypi_client.py pi@192.168.1.100:/home/pi/robot_client/

REM 4. SSH and restart client
ssh pi@192.168.1.100
cd /home/pi/robot_client/
python3 tonypi_client.py --broker 192.168.1.50 --port 1883
```

---

**Last Updated:** December 2025



