# Check if SDK is Already Installed on Raspberry Pi

This guide helps you check if HiwonderSDK or other servo SDKs are already installed on your TonyPi robot.

---

## 🔍 Quick Check Methods

### **Method 1: Check Python Packages (Easiest)**

**SSH into your Raspberry Pi:**
```bash
ssh pi@your-robot-ip
```

**Check for HiwonderSDK:**
```bash
# Check if hiwonder package is installed
pip3 list | grep -i hiwonder

# Or check all installed packages
pip3 list | grep -i servo
pip3 list | grep -i motor
```

**Expected Output if Installed:**
```
hiwonder         1.0.0
# or
hiwonder-sdk     1.0.0
```

**If you see hiwonder in the list → SDK is installed! ✅**

---

### **Method 2: Try Importing SDK**

**On Raspberry Pi, test if SDK can be imported:**
```bash
python3 -c "from hiwonder import Board; print('HiwonderSDK is installed!')"
```

**If it works:**
```
HiwonderSDK is installed!
```
**→ SDK is installed! ✅**

**If you get an error:**
```
ModuleNotFoundError: No module named 'hiwonder'
```
**→ SDK is NOT installed ❌**

---

### **Method 3: Check for SDK Files**

**Check if SDK files exist:**
```bash
# Check common installation locations
ls -la /usr/local/lib/python3.*/site-packages/ | grep -i hiwonder
ls -la ~/.local/lib/python3.*/site-packages/ | grep -i hiwonder
find /usr -name "*hiwonder*" 2>/dev/null
find ~ -name "*hiwonder*" 2>/dev/null
```

**If files are found → SDK might be installed**

---

### **Method 4: Check Robot Software**

**Check if robot has existing software that uses servos:**
```bash
# Check for Python files that import servo libraries
find /home/pi -name "*.py" -exec grep -l "hiwonder\|servo\|Board" {} \;

# Check for installed servo-related packages
pip3 list | grep -E "servo|motor|hiwonder|lx16a|dynamixel"
```

---

## 📋 Complete Check Script

Create this script on your Raspberry Pi to check everything:

**On Raspberry Pi, create `check_sdk.sh`:**

```bash
#!/bin/bash
echo "========================================"
echo "SDK Installation Check"
echo "========================================"
echo ""

echo "1. Checking Python packages..."
echo "   HiwonderSDK:"
pip3 list | grep -i hiwonder || echo "   ❌ Not found"
echo ""
echo "   Other servo libraries:"
pip3 list | grep -E "servo|motor|lx16a|dynamixel" || echo "   ❌ None found"
echo ""

echo "2. Testing SDK import..."
python3 -c "from hiwonder import Board; print('   ✅ HiwonderSDK is installed!')" 2>&1 || echo "   ❌ HiwonderSDK not available"
echo ""

echo "3. Checking for SDK files..."
if find /usr -name "*hiwonder*" 2>/dev/null | head -1; then
    echo "   ✅ SDK files found"
else
    echo "   ❌ SDK files not found"
fi
echo ""

echo "4. Checking serial ports..."
ls -la /dev/ttyUSB* /dev/ttyAMA* 2>/dev/null | head -5 || echo "   ⚠️  No serial ports found"
echo ""

echo "5. Checking Python version..."
python3 --version
echo ""

echo "========================================"
echo "Check Complete"
echo "========================================"
```

**Run it:**
```bash
chmod +x check_sdk.sh
./check_sdk.sh
```

---

## 🎯 Quick Test from Your PC

**You can also check remotely:**

### **Option 1: SSH and Check**

```bash
# From your PC
ssh pi@your-robot-ip "pip3 list | grep -i hiwonder"
```

**If output shows hiwonder → Installed ✅**  
**If no output → Not installed ❌**

### **Option 2: Test Import Remotely**

```bash
# From your PC
ssh pi@your-robot-ip "python3 -c 'from hiwonder import Board; print(\"SDK installed\")'"
```

---

## ✅ What to Do Based on Results

### **If SDK is Installed:**

**Great! You can use it directly:**

1. **Update `tonypi_client.py`** to use the SDK
2. **No installation needed**
3. **Start reading servo data immediately**

I can provide the code to add servo monitoring using the existing SDK.

---

### **If SDK is NOT Installed:**

**You have two options:**

#### **Option A: Install HiwonderSDK (Recommended)**

```bash
# On Raspberry Pi
cd ~
git clone https://github.com/Hiwonder-docs/hiwonder-sdk-python.git
cd hiwonder-sdk-python
sudo pip3 install .
```

**Then test:**
```bash
python3 -c "from hiwonder import Board; print('SDK installed successfully!')"
```

#### **Option B: Use Direct Serial Communication**

If you can't install SDK, use direct serial communication (more complex, but works).

---

## 🔍 Check for Other Servo Libraries

**Also check for other common servo libraries:**

```bash
# On Raspberry Pi
pip3 list | grep -E "pylx16a|dynamixel|pyserial|RPi.GPIO"
```

**Common libraries:**
- `pylx16a` - For LX-16A servos
- `dynamixel-sdk` - For Dynamixel servos
- `pyserial` - For serial communication
- `RPi.GPIO` - For GPIO access

---

## 📊 Quick Decision Tree

```
Is HiwonderSDK installed?
├─ YES → Use it! (Easiest option)
│
└─ NO → Check other options:
    ├─ Install HiwonderSDK (Recommended)
    ├─ Use direct serial communication
    ├─ Check if robot has other servo software
    └─ Use generic servo library (if compatible)
```

---

## 🚀 Next Steps

**After checking:**

1. **If SDK found:** Tell me and I'll provide code to use it
2. **If SDK not found:** 
   - Install it (I can provide instructions)
   - OR use alternative method (I can help with that too)

**To check quickly, run this on your Raspberry Pi:**

```bash
python3 -c "from hiwonder import Board; print('✅ SDK installed')" 2>&1 || echo "❌ SDK not installed"
```

---

## 💡 Pro Tip

**Even if SDK is not installed, you can still retrieve servo data using:**
- Direct serial communication
- Generic servo libraries
- Reverse engineering the protocol

The system I built supports all these methods!

---

**Last Updated:** December 2025





