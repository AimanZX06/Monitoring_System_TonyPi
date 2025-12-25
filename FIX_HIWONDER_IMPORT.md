# Fix "Cannot Import Board from hiwonder" Error

This guide helps you fix the import error and find the correct way to use HiwonderSDK.

---

## 🔍 Problem: Import Error

**Error:**
```
ImportError: cannot import name 'Board' from 'hiwonder'
```

**Possible Causes:**
1. SDK not installed correctly
2. Wrong import path
3. Different SDK version/API
4. SDK needs different installation method

---

## ✅ Solution 1: Check SDK Installation

### **Step 1: Verify SDK is Installed**

```bash
# On Raspberry Pi
pip3 list | grep -i hiwonder
pip3 show hiwonder
```

**If not found, install it:**

```bash
# Method 1: From GitHub
cd ~
git clone https://github.com/Hiwonder-docs/hiwonder-sdk-python.git
cd hiwonder-sdk-python
sudo pip3 install .

# Method 2: Direct pip install (if available)
pip3 install hiwonder
```

### **Step 2: Check SDK Structure**

```bash
# Check what's actually in the hiwonder package
python3 -c "import hiwonder; print(dir(hiwonder))"
```

**This will show available classes/functions**

---

## ✅ Solution 2: Find Correct Import

### **Common Import Variations:**

**Try these imports one by one:**

```python
# Option 1: Direct import
from hiwonder import Board

# Option 2: Module import
import hiwonder
board = hiwonder.Board()

# Option 3: Different class name
from hiwonder import ServoController
from hiwonder import RobotBoard
from hiwonder import TonyPiBoard

# Option 4: Submodule import
from hiwonder.board import Board
from hiwonder.servo import Servo

# Option 5: Check available modules
import hiwonder
print(dir(hiwonder))
```

### **Test Script:**

Create `test_hiwonder_import.py` on Raspberry Pi:

```python
#!/usr/bin/env python3
"""Test different hiwonder import methods"""

print("Testing hiwonder imports...")
print("=" * 50)

# Test 1: Direct import
try:
    from hiwonder import Board
    print("✅ Option 1: from hiwonder import Board - SUCCESS")
    print(f"   Board class: {Board}")
except Exception as e:
    print(f"❌ Option 1 failed: {e}")

# Test 2: Module import
try:
    import hiwonder
    print("✅ Option 2: import hiwonder - SUCCESS")
    print(f"   Available: {dir(hiwonder)}")
    if hasattr(hiwonder, 'Board'):
        print("   ✅ Board found in hiwonder module")
except Exception as e:
    print(f"❌ Option 2 failed: {e}")

# Test 3: Check submodules
try:
    import hiwonder.board
    print("✅ Option 3: hiwonder.board module exists")
except Exception as e:
    print(f"❌ Option 3 failed: {e}")

# Test 4: Check package structure
try:
    import hiwonder
    import os
    import inspect
    sdk_path = inspect.getfile(hiwonder)
    print(f"✅ SDK location: {sdk_path}")
    print(f"   Package contents: {os.listdir(os.path.dirname(sdk_path))}")
except Exception as e:
    print(f"❌ Option 4 failed: {e}")

print("=" * 50)
print("Check the output above to find the correct import method")
```

**Run it:**
```bash
python3 test_hiwonder_import.py
```

---

## ✅ Solution 3: Alternative SDK Installation

### **If Official SDK Doesn't Work:**

**Option A: Install from Different Source**

```bash
# Try alternative installation
pip3 install --upgrade hiwonder
pip3 install --upgrade hiwonder-sdk
pip3 install --upgrade hiwonder-python
```

**Option B: Check Robot's Existing Software**

```bash
# Check if robot has existing servo code
find /home/pi -name "*.py" -exec grep -l "servo\|motor" {} \;

# Check how existing code imports servo libraries
grep -r "import.*servo\|from.*servo" /home/pi --include="*.py"
```

**Option C: Use Direct Serial Communication**

If SDK doesn't work, use direct serial communication (no SDK needed).

---

## ✅ Solution 4: Use Direct Serial (No SDK Needed)

If SDK import fails, use direct serial communication:

### **Step 1: Identify Serial Port**

```bash
# On Raspberry Pi
ls -la /dev/ttyUSB* /dev/ttyAMA* /dev/ttyS*
```

### **Step 2: Install Serial Library**

```bash
pip3 install pyserial
```

### **Step 3: Use Direct Serial Code**

**Add to `robot_client/tonypi_client.py`:**

```python
import serial
import struct

class TonyPiRobotClient:
    def __init__(self, ...):
        # ... existing code ...
        
        # Try to open serial port for servos
        self.servo_serial = None
        self.servo_available = False
        
        # Common serial ports for TonyPi
        serial_ports = ['/dev/ttyUSB0', '/dev/ttyAMA0', '/dev/ttyS0']
        for port in serial_ports:
            try:
                self.servo_serial = serial.Serial(
                    port=port,
                    baudrate=115200,  # Common baud rate
                    timeout=1
                )
                self.servo_available = True
                logger.info(f"Servo serial port opened: {port}")
                break
            except:
                continue
        
        if not self.servo_available:
            logger.warning("No servo serial port available")

    def read_servo_via_serial(self, servo_id: int) -> dict:
        """Read servo data via direct serial communication"""
        if not self.servo_available:
            return {"error": "Serial port not available"}
        
        try:
            # Example: Read servo position (adjust protocol for your servos)
            # This is a generic example - you need to know your servo protocol
            
            # Common protocol format for serial bus servos:
            # Header (0xFF 0xFF) + ID + Length + Command + Data + Checksum
            
            # Read position command (example for LX-16A/HTS servos)
            command = bytes([0xFF, 0xFF, servo_id, 0x04, 0x02, 0x38, 0x00])
            checksum = 255 - ((servo_id + 0x04 + 0x02 + 0x38 + 0x00) % 256)
            command = command + bytes([checksum])
            
            self.servo_serial.write(command)
            time.sleep(0.01)  # Wait for response
            
            # Read response (usually 8 bytes)
            response = self.servo_serial.read(8)
            
            if len(response) >= 8:
                # Parse response (format varies by servo brand)
                position = struct.unpack('<H', response[5:7])[0]  # Example parsing
                
                return {
                    "id": servo_id,
                    "position": position,
                    "available": True
                }
            else:
                return {"error": "No response from servo"}
                
        except Exception as e:
            logger.error(f"Error reading servo {servo_id}: {e}")
            return {"error": str(e)}
```

---

## ✅ Solution 5: Check Robot Documentation

### **Find Robot's Servo Protocol:**

**Method 1: Check Robot Manual**
- Look for servo specifications
- Check communication protocol
- Find servo brand/model

**Method 2: Check Existing Robot Code**
```bash
# On robot, find existing servo code
find /home/pi -name "*.py" | xargs grep -l "servo\|motor" | head -5

# Check how servos are accessed
cat /path/to/servo/file.py
```

**Method 3: Check Installed Libraries**
```bash
# Check what servo libraries are installed
pip3 list | grep -E "servo|motor|serial|uart"
```

---

## 🎯 Quick Fix: Test Different Imports

**Create `test_imports.py` on Raspberry Pi:**

```python
#!/usr/bin/env python3
"""Test all possible hiwonder imports"""

imports_to_try = [
    "from hiwonder import Board",
    "import hiwonder; board = hiwonder.Board()",
    "from hiwonder.board import Board",
    "from hiwonder import ServoController",
    "from hiwonder import RobotBoard",
    "import hiwonder; print(dir(hiwonder))",
]

for imp in imports_to_try:
    try:
        exec(imp)
        print(f"✅ SUCCESS: {imp}")
        break
    except Exception as e:
        print(f"❌ FAILED: {imp} - {e}")
```

**Run:**
```bash
python3 test_imports.py
```

---

## 🔧 Alternative: Use Generic Servo Library

**If HiwonderSDK doesn't work, use generic libraries:**

### **For LX-16A Servos:**

```python
# Install
pip3 install pylx16a

# Use
from pylx16a import LX16A
servo = LX16A("/dev/ttyUSB0")
position = servo.get_servo_position(1)
temperature = servo.get_servo_temp(1)
```

### **For Generic Serial Bus Servos:**

```python
import serial
import struct

# Open serial port
ser = serial.Serial('/dev/ttyUSB0', 115200)

# Send read command (adjust for your servo protocol)
# Read position, temperature, etc.
```

---

## 📋 Troubleshooting Steps

1. **Check SDK Installation:**
   ```bash
   pip3 list | grep hiwonder
   pip3 show hiwonder
   ```

2. **Check SDK Location:**
   ```bash
   python3 -c "import hiwonder; import inspect; print(inspect.getfile(hiwonder))"
   ```

3. **Check Available Classes:**
   ```bash
   python3 -c "import hiwonder; print(dir(hiwonder))"
   ```

4. **Check Documentation:**
   - Look for SDK documentation online
   - Check GitHub repository: https://github.com/Hiwonder-docs/hiwonder-sdk-python
   - Check robot manual

5. **Try Alternative:**
   - Use direct serial communication
   - Use generic servo library
   - Check if robot has existing servo code

---

## ✅ Recommended Next Steps

1. **Run test script** to find correct import
2. **Check robot's existing code** (if any) to see how servos are accessed
3. **If SDK doesn't work**, use direct serial communication
4. **I can help implement** direct serial code once you identify the servo protocol

---

## 🆘 Still Having Issues?

**Provide me with:**
1. Output of: `python3 -c "import hiwonder; print(dir(hiwonder))"`
2. Output of: `pip3 show hiwonder`
3. Any existing servo code on the robot
4. Servo brand/model (if known)

Then I can provide the exact code for your specific setup!

---

**Last Updated:** December 2025





