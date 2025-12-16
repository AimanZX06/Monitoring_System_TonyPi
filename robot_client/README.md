# TonyPi Robot Client Setup Guide

## For Testing (Robot Simulator)

### 1. Install Python Dependencies
```bash
cd robot_client
pip install paho-mqtt psutil asyncio-mqtt
```

### 2. Run the Simulator (for testing)
```bash
# Run simulator connecting to localhost (if running on same machine)
python simulator.py

# Run simulator connecting to remote monitoring system
python simulator.py --broker YOUR_PC_IP --port 1883
```

## For Real TonyPi Robot (Raspberry Pi 5)

### 1. Copy Files to Robot
```bash
# Copy the entire robot_client folder to your Raspberry Pi 5
scp -r robot_client/ pi@your-robot-ip:/home/pi/
```

### 2. Install Dependencies on Robot
```bash
# SSH into your TonyPi robot
ssh pi@your-robot-ip

# Install dependencies
cd /home/pi/robot_client
pip install -r requirements.txt

# Optional: Install hardware-specific libraries
pip install RPi.GPIO gpiozero picamera2 opencv-python
```

### 3. Run Robot Client
```bash
# Replace YOUR_PC_IP with the IP address of your monitoring system
python3 tonypi_client.py --broker YOUR_PC_IP --port 1883
```

### 4. Find Your PC's IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your network adapter.

**Linux/Mac:**
```bash
ifconfig
# or
ip addr show
```

## MQTT Topics Structure

### From Robot to System:
- `tonypi/sensors/{robot_id}` - Sensor data
- `tonypi/status/{robot_id}` - Robot status
- `tonypi/location` - Position data
- `tonypi/battery` - Battery information
- `tonypi/commands/response` - Command responses

### From System to Robot:
- `tonypi/commands/{robot_id}` - Commands to specific robot
- `tonypi/commands/broadcast` - Commands to all robots

## Available Commands

### Movement Commands
```json
{
  "type": "move",
  "direction": "forward|backward|left|right",
  "distance": 1.0,
  "speed": 0.5,
  "id": "unique_command_id"
}
```

### Status Commands
```json
{
  "type": "status_request",
  "id": "unique_command_id"
}
```

### Stop Command
```json
{
  "type": "stop",
  "id": "unique_command_id"
}
```

## Troubleshooting

### Connection Issues
1. Check firewall settings on both machines
2. Ensure MQTT broker (port 1883) is accessible
3. Verify IP addresses are correct
4. Check network connectivity with `ping`

### Permission Issues on Raspberry Pi
```bash
# Add user to gpio group for hardware access
sudo usermod -a -G gpio pi
sudo usermod -a -G i2c pi
sudo usermod -a -G spi pi
```

### Service Setup (Optional)
To run the robot client as a system service:

1. Create service file:
```bash
sudo nano /etc/systemd/system/tonypi-client.service
```

2. Add content:
```ini
[Unit]
Description=TonyPi Robot Client
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/robot_client
ExecStart=/usr/bin/python3 tonypi_client.py --broker YOUR_PC_IP
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. Enable and start:
```bash
sudo systemctl enable tonypi-client.service
sudo systemctl start tonypi-client.service
```