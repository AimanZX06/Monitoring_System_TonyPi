# Servo Data Retrieval - Options Without Source Code

This guide explains how to retrieve servo data from your TonyPi robot, with or without access to the robot's source code.

---

## 📋 Quick Answer

**Do you need source code?**  
**NO** - You don't need the robot's original source code, but you need **one of these**:

1. ✅ **Hardware SDK** (e.g., HiwonderSDK) - Recommended
2. ✅ **Serial/UART communication** - Direct servo communication
3. ✅ **Existing API/Interface** - If robot already exposes data
4. ✅ **Reverse engineering** - Analyze communication protocol

---

## 🎯 Option 1: Use Hardware SDK (Easiest - Recommended)

**You DON'T need the robot's source code** - just the SDK library.

### **For HiWonder TonyPi Robots:**

#### **Step 1: Install HiwonderSDK**

```bash
# On Raspberry Pi 5
ssh pi@your-robot-ip

# Install SDK
cd ~
git clone https://github.com/Hiwonder-docs/hiwonder-sdk-python.git
cd hiwonder-sdk-python
sudo pip3 install .
```

**No source code needed!** The SDK is publicly available.

#### **Step 2: Use SDK in Your Code**

Add to `robot_client/tonypi_client.py`:

```python
# Add to imports
try:
    from hiwonder import Board  # Public SDK - no source code needed
    MOTOR_SDK_AVAILABLE = True
except ImportError:
    MOTOR_SDK_AVAILABLE = False
    logger.warning("Motor SDK not available")

def get_servo_status(self):
    """Get servo data using SDK"""
    if MOTOR_SDK_AVAILABLE:
        # Read servo data - no source code needed!
        temp = Board.getBusServoTemp(servo_id)
        pos = Board.getBusServoPosition(servo_id)
        load = Board.getBusServoLoad(servo_id)
        voltage = Board.getBusServoVin(servo_id)
        # ... use the data
```

**Advantages:**
- ✅ No source code needed
- ✅ Official SDK (well-documented)
- ✅ Easy to use
- ✅ Works with multiple servos

---

## 🎯 Option 2: Direct Serial Communication (No SDK Needed)

If you don't have SDK access, you can communicate directly with servos via serial port.

### **For Serial Bus Servos (HTS/LX Series):**

#### **Step 1: Identify Servo Protocol**

Most TonyPi robots use **serial bus servos** that communicate via UART:
- **Protocol:** Usually Modbus-like or custom serial protocol
- **Port:** `/dev/ttyUSB0` or `/dev/ttyAMA0`
- **Baud Rate:** Typically 115200 or 9600

#### **Step 2: Implement Serial Communication**

Add to `robot_client/tonypi_client.py`:

```python
import serial
import struct

class TonyPiRobotClient:
    def __init__(self, ...):
        # ... existing code ...
        
        # Try to open serial port
        try:
            self.servo_serial = serial.Serial(
                port='/dev/ttyUSB0',  # or /dev/ttyAMA0
                baudrate=115200,
                timeout=1
            )
            self.servo_available = True
        except:
            self.servo_available = False
            logger.warning("Servo serial port not available")

    def read_servo_data(self, servo_id: int) -> dict:
        """Read servo data via direct serial communication"""
        if not self.servo_available:
            return {"error": "Serial port not available"}
        
        try:
            # Example: Read servo position (protocol varies by brand)
            # This is a generic example - adjust for your servo brand
            
            # Send read command (format depends on servo protocol)
            command = self._build_read_command(servo_id, register=0x38)  # Position register
            self.servo_serial.write(command)
            
            # Read response
            response = self.servo_serial.read(8)  # Adjust based on protocol
            
            # Parse response
            position = struct.unpack('<H', response[2:4])[0]  # Example parsing
            
            # Read temperature
            command = self._build_read_command(servo_id, register=0x39)  # Temp register
            self.servo_serial.write(command)
            response = self.servo_serial.read(8)
            temperature = struct.unpack('<B', response[2:3])[0]
            
            return {
                "id": servo_id,
                "position": position,
                "temperature": temperature,
                # ... other parameters
            }
        except Exception as e:
            logger.error(f"Error reading servo {servo_id}: {e}")
            return {"error": str(e)}
    
    def _build_read_command(self, servo_id: int, register: int) -> bytes:
        """Build read command based on servo protocol"""
        # This is a generic example - you need to find your servo's protocol
        # Common formats:
        # - Header (0xFF 0xFF)
        # - Servo ID
        # - Command length
        # - Command (read = 0x02)
        # - Register address
        # - Checksum
        
        # Example for LX-16A protocol:
        header = bytes([0xFF, 0xFF])
        cmd = bytes([servo_id, 0x04, 0x02, register & 0xFF, (register >> 8) & 0xFF])
        checksum = 255 - ((servo_id + 0x04 + 0x02 + (register & 0xFF) + ((register >> 8) & 0xFF)) % 256)
        return header + cmd + bytes([checksum])
```

**Advantages:**
- ✅ No SDK needed
- ✅ No source code needed
- ✅ Direct control
- ⚠️ Requires knowing servo protocol

**Disadvantages:**
- ⚠️ Need to know servo communication protocol
- ⚠️ More complex to implement
- ⚠️ Protocol varies by servo brand

---

## 🎯 Option 3: Use Existing Robot Software (If Available)

If the robot already has software running that exposes servo data:

### **Check 1: Existing API**

```bash
# On robot, check if there's a web API
curl http://localhost:8080/api/servos  # Example
curl http://localhost:8080/status     # Example
```

### **Check 2: Existing MQTT Topics**

```bash
# Subscribe to all MQTT topics
mosquitto_sub -h robot-ip -t "#" -v

# Look for servo-related topics like:
# - robot/servos/#
# - robot/motors/#
# - robot/status/#
```

### **Check 3: Existing ROS Topics (If Robot Uses ROS)**

```bash
# If robot uses ROS
rostopic list | grep servo
rostopic echo /servo_status
```

### **Check 4: Existing Serial/USB Interface**

```bash
# Check if robot exposes data via USB
lsusb
dmesg | grep tty

# Check serial ports
ls -la /dev/tty*
```

**If you find existing interfaces:**
- Integrate with your monitoring system
- No need to implement servo communication yourself

---

## 🎯 Option 4: Reverse Engineer Communication

If you have access to the robot but no documentation:

### **Step 1: Monitor Serial Communication**

```python
# On Raspberry Pi, monitor serial traffic
import serial
import time

ser = serial.Serial('/dev/ttyUSB0', 115200)

while True:
    if ser.in_waiting:
        data = ser.read(ser.in_waiting)
        print(f"Received: {data.hex()}")
        print(f"ASCII: {data}")
    time.sleep(0.1)
```

### **Step 2: Analyze Protocol**

- Capture data packets
- Identify patterns
- Determine command structure
- Implement based on findings

### **Step 3: Test Commands**

```python
# Try common servo commands
commands = [
    b'\xFF\xFF\x01\x04\x02\x38\x00\xXX',  # Read position
    b'\xFF\xFF\x01\x04\x02\x39\x00\xXX',  # Read temperature
    # ... test different commands
]

for cmd in commands:
    ser.write(cmd)
    response = ser.read(8)
    print(f"Command: {cmd.hex()}, Response: {response.hex()}")
```

---

## 🎯 Option 5: Use Generic Servo Libraries

### **For Common Servo Brands:**

#### **LX-16A Servos:**

```python
# Install library
pip3 install pylx16a

# Use library
from pylx16a import LX16A

servo = LX16A("/dev/ttyUSB0")
position = servo.get_servo_position(1)
temperature = servo.get_servo_temp(1)
voltage = servo.get_servo_vin(1)
```

#### **Dynamixel Servos:**

```python
# Install library
pip3 install dynamixel-sdk

# Use library
from dynamixel_sdk import *

# Initialize port handler and packet handler
portHandler = PortHandler("/dev/ttyUSB0")
packetHandler = PacketHandler(2.0)  # Protocol version

# Open port
portHandler.openPort()
portHandler.setBaudRate(57600)

# Read servo data
position, result, error = packetHandler.read2ByteTxRx(portHandler, 1, 36)  # Position
temperature, result, error = packetHandler.read1ByteTxRx(portHandler, 1, 43)  # Temperature
```

---

## 📊 Comparison of Options

| Option | Source Code Needed? | SDK Needed? | Difficulty | Recommended |
|--------|-------------------|-------------|------------|-------------|
| **Hardware SDK** | ❌ No | ✅ Yes | ⭐ Easy | ✅ **Best** |
| **Direct Serial** | ❌ No | ❌ No | ⭐⭐⭐ Hard | ⚠️ Advanced |
| **Existing API** | ❌ No | ❌ No | ⭐ Easy | ✅ If available |
| **Reverse Engineer** | ❌ No | ❌ No | ⭐⭐⭐⭐ Very Hard | ⚠️ Last resort |
| **Generic Library** | ❌ No | ✅ Yes | ⭐⭐ Medium | ✅ Good alternative |

---

## 🎯 Recommended Approach

### **For HiWonder TonyPi (Your Case):**

**Best Option: Use HiwonderSDK**

1. **Install SDK** (publicly available, no source code needed):
   ```bash
   git clone https://github.com/Hiwonder-docs/hiwonder-sdk-python.git
   cd hiwonder-sdk-python
   sudo pip3 install .
   ```

2. **Add code to `tonypi_client.py`** (I can provide the exact code)

3. **That's it!** No source code needed.

### **If SDK Doesn't Work:**

**Alternative: Direct Serial Communication**

1. Identify servo brand/model
2. Find servo protocol documentation (usually available online)
3. Implement serial communication
4. Read servo registers directly

---

## 🔍 How to Identify Your Servo Brand

### **Method 1: Physical Inspection**

- Check servo labels/stickers
- Look for model numbers
- Common brands: Hiwonder, LX-16A, Dynamixel, HTS

### **Method 2: Check Robot Documentation**

- Robot manual
- Technical specifications
- Parts list

### **Method 3: Check Existing Software**

```bash
# On robot, check installed packages
pip3 list | grep -i servo
pip3 list | grep -i motor
pip3 list | grep -i hiwonder

# Check Python imports in existing code
grep -r "import.*servo" /path/to/robot/software
grep -r "from.*servo" /path/to/robot/software
```

### **Method 4: Monitor Serial Traffic**

```python
# Monitor what the robot sends to servos
import serial
ser = serial.Serial('/dev/ttyUSB0', 115200)
# Capture and analyze packets
```

---

## 💡 Practical Implementation

### **Quick Start: Add Servo Monitoring (No Source Code Needed)**

I can help you add servo monitoring to your `tonypi_client.py`. Here's what you need:

1. **Servo brand/model** (to choose right SDK/library)
2. **Number of servos** (to map IDs)
3. **Serial port** (usually `/dev/ttyUSB0` or `/dev/ttyAMA0`)

Then I'll provide code that:
- ✅ Works without robot source code
- ✅ Uses public SDK or direct serial
- ✅ Integrates with your monitoring system
- ✅ Handles multiple servos

---

## ✅ Summary

**Answer to your questions:**

1. **Do you need source code?**  
   **NO** - You don't need the robot's source code.

2. **Is there a way without source code?**  
   **YES** - Multiple options:
   - ✅ Use hardware SDK (HiwonderSDK) - **Easiest**
   - ✅ Direct serial communication
   - ✅ Use existing robot APIs
   - ✅ Generic servo libraries
   - ✅ Reverse engineer protocol

**Recommended:** Use **HiwonderSDK** (publicly available, no source code needed).

---

## 🚀 Next Steps

1. **Identify your servo brand** (check robot documentation or physical inspection)
2. **Choose method** (SDK recommended)
3. **I can help implement** - Just tell me:
   - Servo brand/model
   - Number of servos
   - Serial port location

Then I'll provide the exact code to add to your system!

---

**Last Updated:** December 2025













