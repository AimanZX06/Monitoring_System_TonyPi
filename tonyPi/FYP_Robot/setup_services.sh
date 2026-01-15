#!/bin/bash
# ============================================
# FYP Robot Services Setup Script
# Run this on the TonyPi to set up all services
# ============================================

set -e

echo "=========================================="
echo "  FYP Robot Services Setup"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo: sudo bash setup_services.sh"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get IP address
IP_ADDR=$(hostname -I | awk '{print $1}')

echo ""
echo "Configuration:"
echo "  Script directory: $SCRIPT_DIR"
echo "  Robot IP: $IP_ADDR"
echo ""

# ============================================
# 1. Setup Camera Service
# ============================================
echo "----------------------------------------"
echo "1. Setting up Camera Stream Service..."
echo "----------------------------------------"

# Check if camera service file exists in robot_client
CAMERA_SERVICE="/home/pi/robot_client/tonypi-camera.service"
if [ -f "$CAMERA_SERVICE" ]; then
    cp "$CAMERA_SERVICE" /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable tonypi-camera.service
    systemctl restart tonypi-camera.service
    echo "   ✓ Camera service installed and started"
else
    echo "   ⚠ Camera service file not found at $CAMERA_SERVICE"
    echo "   Creating inline service..."
    
    cat > /etc/systemd/system/tonypi-camera.service << 'EOF'
[Unit]
Description=TonyPi Camera MJPEG Stream Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/robot_client
ExecStart=/usr/bin/python3 /home/pi/robot_client/camera_stream.py --port 8080
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable tonypi-camera.service
    systemctl start tonypi-camera.service || echo "   ⚠ Camera service failed to start"
fi

# ============================================
# 2. Setup FYP Robot Main Service
# ============================================
echo ""
echo "----------------------------------------"
echo "2. Setting up FYP Robot Main Service..."
echo "----------------------------------------"

FYP_SERVICE="$SCRIPT_DIR/fyp-robot.service"
if [ -f "$FYP_SERVICE" ]; then
    cp "$FYP_SERVICE" /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable fyp-robot.service
    echo "   ✓ FYP Robot service installed"
    echo "   Note: Start manually with: sudo systemctl start fyp-robot"
else
    echo "   ⚠ FYP Robot service file not found"
fi

# ============================================
# 3. Setup Robot Client (MQTT Telemetry)
# ============================================
echo ""
echo "----------------------------------------"
echo "3. Setting up Robot Client Service..."
echo "----------------------------------------"

ROBOT_SERVICE="/home/pi/robot_client/tonypi-robot.service"
if [ -f "$ROBOT_SERVICE" ]; then
    cp "$ROBOT_SERVICE" /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable tonypi-robot.service
    systemctl restart tonypi-robot.service
    echo "   ✓ Robot client service installed and started"
else
    echo "   ⚠ Robot client service file not found"
fi

# ============================================
# Summary
# ============================================
echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Services status:"
echo ""

for svc in tonypi-camera tonypi-robot fyp-robot; do
    if systemctl is-enabled $svc.service &>/dev/null; then
        STATUS=$(systemctl is-active $svc.service)
        echo "  $svc: enabled ($STATUS)"
    else
        echo "  $svc: not installed"
    fi
done

echo ""
echo "=========================================="
echo "  URLs & Commands"
echo "=========================================="
echo ""
echo "Camera Stream:  http://$IP_ADDR:8080/?action=stream"
echo "Camera Snapshot: http://$IP_ADDR:8080/?action=snapshot"
echo ""
echo "View logs:"
echo "  sudo journalctl -u tonypi-camera -f"
echo "  sudo journalctl -u tonypi-robot -f"
echo "  sudo journalctl -u fyp-robot -f"
echo ""
echo "Control services:"
echo "  sudo systemctl [start|stop|restart|status] <service-name>"
echo ""
