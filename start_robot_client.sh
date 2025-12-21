#!/bin/bash
# Script to start robot client on Raspberry Pi
# Usage: ./start_robot_client.sh [BROKER_IP]

BROKER_IP=${1:-"192.168.1.12"}  # Default to your PC IP
PORT=1883

echo "========================================"
echo "Starting TonyPi Robot Client"
echo "========================================"
echo "Broker: $BROKER_IP:$PORT"
echo ""

cd /home/pi/robot_client

# Check if file exists
if [ ! -f "tonypi_client.py" ]; then
    echo "ERROR: tonypi_client.py not found in /home/pi/robot_client/"
    exit 1
fi

# Check if servo code exists
if ! grep -q "send_servo_status" tonypi_client.py; then
    echo "WARNING: Servo monitoring code not found in tonypi_client.py"
    echo "Make sure you copied the updated file!"
fi

# Start the client
echo "Starting robot client..."
python3 tonypi_client.py --broker $BROKER_IP --port $PORT
