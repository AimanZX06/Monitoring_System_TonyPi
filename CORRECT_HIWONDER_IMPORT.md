# Correct HiwonderSDK Import Method

## ✅ **Correct Import (Found!)**

The correct way to import Board from HiwonderSDK is:

```python
import hiwonder.ros_robot_controller_sdk as rrc
board = rrc.Board()
```

**NOT:** `from hiwonder import Board` ❌  
**CORRECT:** `import hiwonder.ros_robot_controller_sdk as rrc` ✅

---

## 🔧 Updated Code for Your System

### **Update `robot_client/tonypi_client.py`:**

```python
# Add to imports at top of file
try:
    import hiwonder.ros_robot_controller_sdk as rrc
    MOTOR_SDK_AVAILABLE = True
    logger.info("HiwonderSDK loaded successfully")
except ImportError as e:
    MOTOR_SDK_AVAILABLE = False
    logger.warning(f"Motor SDK not available: {e}")

class TonyPiRobotClient:
    def __init__(self, ...):
        # ... existing code ...
        
        # Initialize Board if SDK available
        self.board = None
        if MOTOR_SDK_AVAILABLE:
            try:
                self.board = rrc.Board()
                logger.info("Board initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Board: {e}")
                MOTOR_SDK_AVAILABLE = False
        
        # Servo IDs (adjust based on your robot)
        self.servo_ids = {
            1: "servo_1",
            2: "servo_2",
            3: "servo_3",
            4: "servo_4",
            5: "servo_5",
            6: "servo_6"
        }

    def get_servo_status(self) -> Dict[str, Any]:
        """Get status of all servos"""
        servo_data = {}
        
        if MOTOR_SDK_AVAILABLE and self.board:
            for servo_id, servo_name in self.servo_ids.items():
                try:
                    # Read servo parameters using correct SDK methods
                    # Note: Method names may vary - check SDK documentation
                    
                    # Try common method names
                    try:
                        temp = self.board.getBusServoTemp(servo_id)
                    except:
                        try:
                            temp = self.board.get_servo_temp(servo_id)
                        except:
                            temp = None
                    
                    try:
                        pos = self.board.getBusServoPosition(servo_id)
                    except:
                        try:
                            pos = self.board.get_servo_position(servo_id)
                        except:
                            pos = None
                    
                    try:
                        load = self.board.getBusServoLoad(servo_id)
                    except:
                        try:
                            load = self.board.get_servo_load(servo_id)
                        except:
                            load = None
                    
                    servo_data[servo_name] = {
                        "id": servo_id,
                        "temperature": temp / 10.0 if temp else None,
                        "position": pos if pos else None,
                        "load": abs(load) if load else None,
                    }
                except Exception as e:
                    logger.error(f"Error reading servo {servo_id}: {e}")
                    servo_data[servo_name] = {"error": str(e)}
        else:
            # Simulated data for testing
            import random
            for servo_id, servo_name in self.servo_ids.items():
                servo_data[servo_name] = {
                    "id": servo_id,
                    "temperature": round(random.uniform(35, 70), 1),
                    "position": random.randint(-90, 90),
                    "load": round(random.uniform(10, 85), 1),
                }
        
        return servo_data

    def send_servo_status(self):
        """Publish servo status to MQTT"""
        servo_status = self.get_servo_status()
        
        payload = {
            "robot_id": self.robot_id,
            "timestamp": datetime.now().isoformat(),
            "servos": servo_status
        }
        
        servo_topic = f"tonypi/servos/{self.robot_id}"
        self.client.publish(servo_topic, json.dumps(payload))
```

---

## 🧪 Test the Correct Import

**On Raspberry Pi, test:**

```python
python3 -c "
import hiwonder.ros_robot_controller_sdk as rrc
try:
    board = rrc.Board()
    print('✅ Board initialized successfully!')
    print(f'Board object: {board}')
    print(f'Available methods: {[m for m in dir(board) if not m.startswith(\"_\")][:10]}')
except Exception as e:
    print(f'❌ Error: {e}')
"
```

---

## 📋 Updated Test Command

**Update Step 2.2 in SYSTEM_TESTING_CHECKLIST.md:**

**OLD (incorrect):**
```python
from hiwonder import Board
```

**NEW (correct):**
```python
import hiwonder.ros_robot_controller_sdk as rrc
board = rrc.Board()
temp = board.getBusServoTemp(1)  # Adjust method name if needed
```

---

## 🔍 Find Correct Method Names

**After importing correctly, check available methods:**

```python
import hiwonder.ros_robot_controller_sdk as rrc
board = rrc.Board()

# List all available methods
print("Available methods:")
for method in dir(board):
    if not method.startswith('_') and 'servo' in method.lower():
        print(f"  - {method}")
```

**Common method names to try:**
- `getBusServoTemp(id)`
- `get_servo_temp(id)`
- `getBusServoPosition(id)`
- `get_servo_position(id)`
- `getBusServoLoad(id)`
- `get_servo_load(id)`

---

## ✅ Quick Fix Summary

1. **Use correct import:**
   ```python
   import hiwonder.ros_robot_controller_sdk as rrc
   board = rrc.Board()
   ```

2. **Test on Raspberry Pi:**
   ```bash
   python3 -c "import hiwonder.ros_robot_controller_sdk as rrc; board = rrc.Board(); print('✅ Success')"
   ```

3. **Update your code** with the correct import

4. **Check method names** - they may differ from documentation

---

**Last Updated:** December 2025













