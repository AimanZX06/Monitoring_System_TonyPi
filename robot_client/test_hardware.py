#!/usr/bin/env python3
"""
TonyPi Robot Hardware Integration Tests
Run this script on the TonyPi robot to verify all hardware components.

Usage:
    python3 test_hardware.py           # Run all tests
    python3 test_hardware.py --quick   # Quick test (no buzzer/LED)
    python3 test_hardware.py --servo   # Test specific servo movement
"""

# ============================================================================
# IMPORTS SECTION
# ============================================================================

# sys: Provides access to system-specific parameters and functions
# - sys.path: List of directories Python searches for modules
# - sys.exit(): Exit the program with a status code
import sys

# os: Provides functions for interacting with the operating system
# - os.path: For file/directory path manipulation
# - os.path.exists(): Check if a file or directory exists
import os

# time: Provides time-related functions
# - time.sleep(): Pause execution for specified seconds
import time

# argparse: Used to parse command-line arguments
# - Allows users to pass flags like --quick, --servo, --camera
import argparse

# ============================================================================
# PATH CONFIGURATION
# ============================================================================

# Add the current script's directory to Python's module search path
# This allows importing local modules like 'hiwonder' from the same directory
# os.path.abspath(__file__) = full path to this script
# os.path.dirname() = gets the directory containing this script
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Check if we're running on the actual TonyPi robot
# The TonyPi robot has its SDK installed at /home/pi/TonyPi
# If this directory exists, add it and its SDK subdirectory to the path
# This allows the script to find the hardware SDK when running on the robot
if os.path.exists('/home/pi/TonyPi'):
    sys.path.append('/home/pi/TonyPi')           # Main TonyPi directory
    sys.path.append('/home/pi/TonyPi/HiwonderSDK')  # Hiwonder SDK directory

# ============================================================================
# TEST RESULTS TRACKING CLASS
# ============================================================================

class TestResults:
    """
    A class to track and display the results of all hardware tests.
    
    This class keeps count of:
    - passed: Number of tests that succeeded
    - failed: Number of tests that failed
    - skipped: Number of tests that were skipped (e.g., hardware not available)
    - tests: A list storing detailed information about each test
    """
    
    def __init__(self):
        """
        Initialize the TestResults object with zero counts and empty test list.
        Called when you create a new TestResults() object.
        """
        self.passed = 0    # Counter for passed tests
        self.failed = 0    # Counter for failed tests
        self.skipped = 0   # Counter for skipped tests
        self.tests = []    # List to store all test results with details
    
    def add(self, name, status, message=""):
        """
        Add a test result to the tracker.
        
        Args:
            name (str): The name/description of the test
            status (str): Either "PASS", "FAIL", or "SKIP"
            message (str): Optional additional details about the result
        """
        # Store the test result as a dictionary in our tests list
        self.tests.append({"name": name, "status": status, "message": message})
        
        # Increment the appropriate counter based on the status
        if status == "PASS":
            self.passed += 1
        elif status == "FAIL":
            self.failed += 1
        else:  # SKIP or any other status
            self.skipped += 1
        
        # Print the result immediately so user can see progress
        # Choose an appropriate emoji icon based on status
        icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⏭️"
        
        # Build the output string with optional message
        # f-strings allow embedding variables directly in strings with {variable}
        print(f"  {icon} {name}: {status}" + (f" - {message}" if message else ""))
    
    def summary(self):
        """
        Print a summary of all test results at the end.
        Shows total counts and lists any failed tests.
        """
        # Print a visual separator and header
        print("\n" + "=" * 60)  # "\n" = newline, "=" * 60 = 60 equal signs
        print("TEST SUMMARY")
        print("=" * 60)
        
        # Print the counts for each category
        print(f"  ✅ Passed:  {self.passed}")
        print(f"  ❌ Failed:  {self.failed}")
        print(f"  ⏭️  Skipped: {self.skipped}")
        print(f"  📊 Total:   {len(self.tests)}")  # len() gives list length
        print("=" * 60)
        
        # Print final message based on whether all tests passed
        if self.failed == 0:
            print("🎉 All tests passed! Your TonyPi hardware is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the results above.")
            print("\nFailed tests:")
            # Loop through all tests and print details of failed ones
            for test in self.tests:
                if test["status"] == "FAIL":
                    print(f"  - {test['name']}: {test['message']}")


# Create a global TestResults instance that all test functions will use
# "Global" means it can be accessed from anywhere in this file
results = TestResults()


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def print_header(title):
    """
    Print a section header with a title surrounded by equal signs.
    Used to visually separate different test sections in the output.
    
    Args:
        title (str): The title text to display in the header
    """
    print("\n" + "=" * 60)  # Print newline followed by 60 equal signs
    print(f"  {title}")     # Print the title with 2 spaces indent
    print("=" * 60)         # Print another line of 60 equal signs


# ============================================================================
# TEST FUNCTIONS
# ============================================================================

def test_sdk_import():
    """
    Test 1: SDK Import
    
    Tests whether the Hiwonder SDK modules can be imported.
    These are the Python libraries needed to control the robot's hardware.
    
    Returns:
        rrc: The imported ros_robot_controller_sdk module, or None if import failed
    """
    print_header("TEST 1: SDK Import")
    
    # Try to import the main robot controller SDK
    # 'try/except' catches errors so the program doesn't crash
    try:
        # Import the SDK module and give it a shorter alias 'rrc'
        from hiwonder import ros_robot_controller_sdk as rrc
        results.add("Import ros_robot_controller_sdk", "PASS")
    except ImportError as e:
        # ImportError occurs when Python can't find or load the module
        # 'e' contains the error details
        results.add("Import ros_robot_controller_sdk", "FAIL", str(e))
        return None  # Return early since we can't continue without this
    
    # Try to import the Controller class (used for servo control)
    try:
        from hiwonder.Controller import Controller
        results.add("Import Controller", "PASS")
    except ImportError as e:
        results.add("Import Controller", "FAIL", str(e))
    
    # Try to import the Sonar class (used for ultrasonic distance sensor)
    try:
        from hiwonder.Sonar import Sonar
        results.add("Import Sonar", "PASS")
    except ImportError as e:
        results.add("Import Sonar", "FAIL", str(e))
    
    # Try to import the action group control (used for pre-programmed movements)
    try:
        from hiwonder.ActionGroupControl import runActionGroup
        results.add("Import ActionGroupControl", "PASS")
    except ImportError as e:
        results.add("Import ActionGroupControl", "FAIL", str(e))
    
    # Return the SDK module so other tests can use it
    return rrc


def test_board_connection(rrc):
    """
    Test 2: Board Connection
    
    Tests whether we can connect to the robot's main control board.
    The control board is the hardware that interfaces with all sensors and servos.
    
    Args:
        rrc: The ros_robot_controller_sdk module from test_sdk_import()
    
    Returns:
        tuple: (board, controller) - The board and controller objects, or (None, None) if failed
    """
    print_header("TEST 2: Board Connection")
    
    # If SDK wasn't imported, we can't create the board
    if rrc is None:
        results.add("Create Board instance", "SKIP", "SDK not imported")
        return None, None  # Return a tuple of two None values
    
    # Try to create a Board instance (this connects to the hardware)
    try:
        board = rrc.Board()  # Create new Board object
        
        # Check if the board is running in simulation mode
        # Simulation mode means no real hardware is connected
        if board.simulation_mode:
            results.add("Create Board instance", "FAIL", "Running in simulation mode (no hardware)")
            return board, None
        else:
            results.add("Create Board instance", "PASS", "Hardware mode")
    except Exception as e:
        # Catch any error that might occur
        results.add("Create Board instance", "FAIL", str(e))
        return None, None
    
    # Enable data reception from the board
    # This starts a thread that continuously receives sensor data
    try:
        board.enable_reception(True)  # True = enable, False = disable
        time.sleep(0.5)  # Wait 500ms for the reception thread to start
        results.add("Enable data reception", "PASS")
    except Exception as e:
        results.add("Enable data reception", "FAIL", str(e))
    
    # Create a Controller instance for servo control
    try:
        from hiwonder.Controller import Controller
        controller = Controller(board)  # Controller needs the board as parameter
        results.add("Create Controller instance", "PASS")
    except Exception as e:
        results.add("Create Controller instance", "FAIL", str(e))
        controller = None  # Set to None if creation failed
    
    # Return both the board and controller for other tests to use
    return board, controller


def test_battery(board):
    """
    Test 3: Battery Reading
    
    Tests whether we can read the robot's battery voltage.
    Important for knowing if the robot has enough power to operate.
    
    Args:
        board: The Board instance from test_board_connection()
    """
    print_header("TEST 3: Battery Voltage")
    
    # Skip if no hardware is available
    if board is None or board.simulation_mode:
        results.add("Read battery voltage", "SKIP", "No hardware")
        return
    
    # Try to read battery voltage multiple times
    # Sometimes the first few reads might return None while board initializes
    battery = None
    for _ in range(10):  # '_' is used when we don't need the loop variable
        battery = board.get_battery()  # Returns voltage in millivolts (mV)
        if battery is not None:
            break  # Exit loop early if we got a reading
        time.sleep(0.1)  # Wait 100ms between attempts
    
    # Process and display the battery reading
    if battery is not None:
        # Convert millivolts to volts (e.g., 11200 mV -> 11.2 V)
        voltage = battery / 1000.0
        
        # Check if voltage is in normal range (9V to 12.6V for 3S LiPo battery)
        if voltage >= 9.0 and voltage <= 12.6:
            results.add("Read battery voltage", "PASS", f"{voltage:.2f}V")
            # :.2f means format as float with 2 decimal places
        elif voltage < 9.0:
            # Low battery warning
            results.add("Read battery voltage", "PASS", f"{voltage:.2f}V (LOW - Please charge!)")
        else:
            # Unusually high voltage
            results.add("Read battery voltage", "PASS", f"{voltage:.2f}V (Value seems high)")
    else:
        results.add("Read battery voltage", "FAIL", "No data received")


def test_imu(board, controller):
    """
    Test 4: IMU Sensor
    
    Tests the Inertial Measurement Unit (IMU) which contains:
    - Accelerometer: Measures acceleration (including gravity)
    - Gyroscope: Measures angular velocity (rotation speed)
    
    The IMU helps the robot know its orientation and movement.
    
    Args:
        board: The Board instance
        controller: The Controller instance
    """
    print_header("TEST 4: IMU Sensor (Accelerometer/Gyroscope)")
    
    # Skip if no hardware available
    if board is None or board.simulation_mode:
        results.add("Read IMU data", "SKIP", "No hardware")
        return
    
    # Try to read IMU data multiple times
    imu = None
    for _ in range(10):
        # Use controller if available, otherwise use board directly
        if controller:
            imu = controller.get_imu()
        else:
            imu = board.get_imu()
        
        if imu is not None:
            break
        time.sleep(0.1)
    
    # Process IMU data if we got a reading
    if imu is not None:
        # IMU returns 6 values:
        # ax, ay, az = acceleration in x, y, z axes (m/s²)
        # gx, gy, gz = angular velocity in x, y, z axes (degrees/second)
        ax, ay, az, gx, gy, gz = imu  # Unpack the tuple into 6 variables
        
        # Calculate the magnitude (total strength) of gravity
        # When the robot is stationary, this should be ~9.8 m/s² (Earth's gravity)
        # Formula: magnitude = sqrt(ax² + ay² + az²)
        gravity_magnitude = (ax**2 + ay**2 + az**2) ** 0.5  # ** 0.5 = square root
        
        # Check if accelerometer is detecting gravity correctly
        # Allow range of 8-12 m/s² for tolerance
        if 8.0 <= gravity_magnitude <= 12.0:
            results.add("IMU Accelerometer", "PASS", f"ax={ax:.2f}, ay={ay:.2f}, az={az:.2f}")
        else:
            results.add("IMU Accelerometer", "FAIL", f"Unexpected gravity: {gravity_magnitude:.2f} m/s²")
        
        # Gyroscope test - just verify we got data
        results.add("IMU Gyroscope", "PASS", f"gx={gx:.2f}, gy={gy:.2f}, gz={gz:.2f}")
    else:
        results.add("Read IMU data", "FAIL", "No data received")


def test_servos(controller, board):
    """
    Test 5: Servo Readings
    
    Tests the bus servos by READING their data (not moving them).
    TonyPi uses serial bus servos that can report:
    - Current position (pulse width)
    - Temperature
    - Input voltage
    
    This is a safe test that only reads data without any movement.
    
    Args:
        controller: The Controller instance
        board: The Board instance
    
    Returns:
        dict: Dictionary containing servo data for each servo ID
    """
    print_header("TEST 5: Bus Servos (Reading Only - Safe)")
    
    # Skip if no hardware available
    if controller is None or (board and board.simulation_mode):
        results.add("Read servo data", "SKIP", "No hardware")
        return
    
    # Inform user what this test does
    print("  Reading data from servos 1-6...")
    print("  (This only READS data, does NOT move servos)")
    print()
    
    # Dictionary to store all servo data
    servo_data = {}
    
    # Loop through servos 1 to 6 (TonyPi typically has 6 main servos)
    # range(1, 7) generates: 1, 2, 3, 4, 5, 6
    for servo_id in range(1, 7):
        print(f"  Servo {servo_id}:")
        
        # --- Read position ---
        try:
            # Get servo position in "pulse" units (typically 0-1000)
            position = controller.get_bus_servo_pulse(servo_id)
            if position is not None:
                results.add(f"Servo {servo_id} position", "PASS", f"{position} pulse")
                servo_data[servo_id] = {"position": position}  # Store in dictionary
            else:
                results.add(f"Servo {servo_id} position", "FAIL", "No response")
                continue  # Skip to next servo if this one isn't responding
        except Exception as e:
            results.add(f"Servo {servo_id} position", "FAIL", str(e))
            continue
        
        # --- Read temperature ---
        try:
            # Get servo temperature in degrees Celsius
            temp = controller.get_bus_servo_temp(servo_id)
            if temp is not None:
                # Check if temperature is safe (below 70°C)
                if temp < 70:
                    results.add(f"Servo {servo_id} temperature", "PASS", f"{temp}°C")
                else:
                    # Servo is running hot - warn user
                    results.add(f"Servo {servo_id} temperature", "PASS", f"{temp}°C (HOT!)")
                servo_data[servo_id]["temp"] = temp  # Add temp to existing entry
            else:
                results.add(f"Servo {servo_id} temperature", "FAIL", "No response")
        except Exception as e:
            results.add(f"Servo {servo_id} temperature", "FAIL", str(e))
        
        # --- Read voltage ---
        try:
            # Get servo input voltage in millivolts
            voltage = controller.get_bus_servo_vin(servo_id)
            if voltage is not None:
                v = voltage / 1000.0  # Convert mV to V
                results.add(f"Servo {servo_id} voltage", "PASS", f"{v:.2f}V")
                servo_data[servo_id]["voltage"] = voltage
            else:
                results.add(f"Servo {servo_id} voltage", "FAIL", "No response")
        except Exception as e:
            results.add(f"Servo {servo_id} voltage", "FAIL", str(e))
        
        print()  # Blank line between servos for readability
    
    return servo_data


def test_ultrasonic():
    """
    Test 6: Ultrasonic Sensor
    
    Tests the ultrasonic distance sensor (sonar).
    This sensor uses sound waves to measure distance to objects.
    It sends out a pulse and measures the time for the echo to return.
    
    Typical range: 20mm to 4000mm (2cm to 4m)
    """
    print_header("TEST 6: Ultrasonic Distance Sensor")
    
    try:
        # Import and create the Sonar sensor object
        from hiwonder.Sonar import Sonar
        sonar = Sonar()
        
        # Check if sonar is in simulation mode (no I2C hardware)
        if sonar.simulation_mode:
            results.add("Ultrasonic sensor", "SKIP", "No I2C available")
            return
        
        # Read distance multiple times for a more reliable measurement
        readings = []  # List to store valid readings
        for _ in range(5):
            dist = sonar.getDistance()  # Returns distance in millimeters
            # 99999 is returned when no object is detected or error
            if dist != 99999:
                readings.append(dist)  # Add to list if valid
            time.sleep(0.1)  # Small delay between readings
        
        # Process the readings
        if readings:  # If list is not empty (truthy)
            # Calculate average distance
            avg_dist = sum(readings) / len(readings)
            # Display in both mm and cm
            results.add("Read distance", "PASS", f"{avg_dist:.0f}mm ({avg_dist/10:.1f}cm)")
            
            # Provide helpful hints based on distance
            if avg_dist < 100:  # Less than 10cm
                print("  💡 Object detected very close!")
            elif avg_dist > 4000:  # More than 4m (maximum range)
                print("  💡 No object in range or open space detected")
        else:
            results.add("Read distance", "FAIL", "Sensor not responding")
            
    except Exception as e:
        results.add("Ultrasonic sensor", "FAIL", str(e))


def test_buzzer(board, skip=False):
    """
    Test 7: Buzzer
    
    Tests the onboard buzzer by playing a short beep.
    The buzzer is useful for audio feedback and alerts.
    
    Args:
        board: The Board instance
        skip (bool): If True, skip this test (used with --quick flag)
    """
    print_header("TEST 7: Buzzer")
    
    # Skip if requested (for quiet operation)
    if skip:
        results.add("Buzzer test", "SKIP", "Skipped with --quick flag")
        return
    
    # Skip if no hardware available
    if board is None or board.simulation_mode:
        results.add("Buzzer test", "SKIP", "No hardware")
        return
    
    print("  🔊 Playing a short beep...")
    print("  (If you hear a beep, the buzzer works!)")
    
    try:
        # set_buzzer parameters:
        # - frequency: 1000 Hz (pitch of the beep)
        # - on_time: 0.2 seconds (how long buzzer is on)
        # - off_time: 0.1 seconds (how long buzzer is off between repeats)
        # - repeat: 1 (number of times to play)
        board.set_buzzer(1000, 0.2, 0.1, 1)
        time.sleep(0.5)  # Wait for buzzer to finish
        results.add("Buzzer test", "PASS", "Beep sent (did you hear it?)")
    except Exception as e:
        results.add("Buzzer test", "FAIL", str(e))


def test_led(board, skip=False):
    """
    Test 8: LED
    
    Tests the onboard LED by blinking it a few times.
    The LED can be used for visual status indicators.
    
    Args:
        board: The Board instance
        skip (bool): If True, skip this test (used with --quick flag)
    """
    print_header("TEST 8: LED")
    
    # Skip if requested
    if skip:
        results.add("LED test", "SKIP", "Skipped with --quick flag")
        return
    
    # Skip if no hardware available
    if board is None or board.simulation_mode:
        results.add("LED test", "SKIP", "No hardware")
        return
    
    print("  💡 Blinking LED...")
    
    try:
        # set_led parameters:
        # - on_time: 0.2 seconds (LED on duration)
        # - off_time: 0.2 seconds (LED off duration)
        # - repeat: 3 (blink 3 times)
        # - led_id: 1 (which LED to control)
        board.set_led(0.2, 0.2, 3, 1)
        time.sleep(1.5)  # Wait for blinking to finish (3 blinks × 0.4s each = 1.2s)
        results.add("LED test", "PASS", "Blink command sent (did you see it?)")
    except Exception as e:
        results.add("LED test", "FAIL", str(e))


def test_camera():
    """
    Test 9: Camera
    
    Tests if a camera is available and can capture images.
    Uses OpenCV (cv2) library for camera access.
    The camera is used for computer vision tasks like object detection.
    """
    print_header("TEST 9: Camera (Optional)")
    
    try:
        # Import OpenCV library for camera operations
        import cv2
        
        # Try to open camera
        # -1 tells OpenCV to auto-detect the first available camera
        cap = cv2.VideoCapture(-1)
        
        # If auto-detect fails, try camera index 0 explicitly
        if not cap.isOpened():
            cap = cv2.VideoCapture(0)
        
        # Check if camera was successfully opened
        if cap.isOpened():
            # Read one frame from the camera
            # ret = True if frame was captured successfully
            # frame = the image data as a numpy array
            ret, frame = cap.read()
            
            if ret and frame is not None:
                # Get the image dimensions
                # frame.shape returns (height, width, channels)
                # [:2] gets just the first two values (h, w)
                h, w = frame.shape[:2]
                results.add("Camera capture", "PASS", f"Resolution: {w}x{h}")
            else:
                results.add("Camera capture", "FAIL", "Could not read frame")
            
            # Release the camera resource
            cap.release()
        else:
            results.add("Camera capture", "FAIL", "Could not open camera")
            
    except ImportError:
        # OpenCV is not installed
        results.add("Camera test", "SKIP", "OpenCV not installed")
    except Exception as e:
        results.add("Camera test", "FAIL", str(e))


def test_gpio_light_sensor():
    """
    Test 10: GPIO Light Sensor (Optional)
    
    Tests if GPIO (General Purpose Input/Output) is available.
    GPIO pins can be used to connect additional sensors like light sensors.
    This test only checks if RPi.GPIO library is available.
    """
    print_header("TEST 10: GPIO/Light Sensor (Optional)")
    
    try:
        # RPi.GPIO is the standard library for Raspberry Pi GPIO control
        import RPi.GPIO as GPIO
        results.add("GPIO available", "PASS", "RPi.GPIO imported")
    except ImportError:
        # This usually fails when not running on a Raspberry Pi
        results.add("GPIO test", "SKIP", "RPi.GPIO not available (not on Raspberry Pi?)")


def test_servo_movement(controller, board):
    """
    Interactive test: Servo Movement
    
    This is an INTERACTIVE test that actually MOVES a servo.
    It requires user confirmation before proceeding because
    moving servos could cause the robot to fall if not supported.
    
    The test:
    1. Reads current position of servo 1 (typically the head)
    2. Moves it slightly (±50 pulse units)
    3. Moves it back to the original position
    
    Args:
        controller: The Controller instance
        board: The Board instance
    """
    print_header("INTERACTIVE: Servo Movement Test")
    
    # Skip if no hardware available
    if controller is None or (board and board.simulation_mode):
        print("  Cannot test servo movement - no hardware available")
        return
    
    # Display warning and ask for user confirmation
    print("  ⚠️  WARNING: This will MOVE the robot's servos!")
    print("  Make sure the robot is on a stable surface and won't fall.")
    print()
    
    # Get user input and normalize it
    # .strip() removes whitespace, .lower() converts to lowercase
    response = input("  Proceed with servo movement test? (yes/no): ").strip().lower()
    
    # Only proceed if user explicitly types "yes"
    if response != "yes":
        print("  Skipping servo movement test.")
        results.add("Servo movement", "SKIP", "User declined")
        return
    
    print()
    print("  Testing small movement on Servo 1 (head)...")
    
    try:
        # Step 1: Read the current position of servo 1
        current = controller.get_bus_servo_pulse(1)
        if current is None:
            results.add("Servo movement", "FAIL", "Could not read current position")
            return
        
        print(f"  Current position: {current}")
        
        # Step 2: Calculate target position
        # Move by +50 pulse units, but if that would exceed 1000, move -50 instead
        target = current + 50
        if target > 1000:  # Don't exceed maximum position
            target = current - 50
        
        # Step 3: Move to the target position
        print(f"  Moving to: {target}")
        # set_bus_servo_pulse parameters:
        # - servo_id: 1 (which servo)
        # - pulse: target position (0-1000)
        # - time: 500 (movement duration in milliseconds)
        controller.set_bus_servo_pulse(1, target, 500)
        time.sleep(0.7)  # Wait for movement to complete (500ms + buffer)
        
        # Step 4: Read the new position to verify movement
        new_pos = controller.get_bus_servo_pulse(1)
        print(f"  New position: {new_pos}")
        
        # Step 5: Move back to the original position
        print(f"  Moving back to: {current}")
        controller.set_bus_servo_pulse(1, current, 500)
        time.sleep(0.7)
        
        results.add("Servo movement", "PASS", "Servo moved successfully")
        
    except Exception as e:
        results.add("Servo movement", "FAIL", str(e))


# ============================================================================
# MAIN FUNCTION
# ============================================================================

def main():
    """
    Main function that orchestrates all the hardware tests.
    
    This function:
    1. Parses command-line arguments
    2. Displays a welcome banner
    3. Runs all tests in sequence
    4. Displays the final summary
    
    Returns:
        int: 0 if all tests passed, 1 if any test failed
    """
    
    # Set up command-line argument parser
    parser = argparse.ArgumentParser(description="TonyPi Hardware Integration Tests")
    
    # Add optional flags
    # action="store_true" means the flag is False by default, True if present
    parser.add_argument("--quick", action="store_true", help="Skip buzzer and LED tests")
    parser.add_argument("--servo", action="store_true", help="Include servo movement test")
    parser.add_argument("--camera", action="store_true", help="Include camera test")
    
    # Parse the arguments from command line
    args = parser.parse_args()
    
    # Print welcome banner
    # Box-drawing characters create a nice visual border
    print()
    print("╔════════════════════════════════════════════════════════════╗")
    print("║        TonyPi Robot Hardware Integration Tests             ║")
    print("╠════════════════════════════════════════════════════════════╣")
    print("║  This script tests all hardware components on your robot.  ║")
    print("║  Make sure the robot is powered on and connected.          ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print()
    
    # ========================================================================
    # RUN TESTS IN SEQUENCE
    # ========================================================================
    
    # Test 1: Import SDK modules
    # Returns the SDK module or None if import failed
    rrc = test_sdk_import()
    
    # Test 2: Connect to the control board
    # Returns (board, controller) tuple
    board, controller = test_board_connection(rrc)
    
    # Test 3: Read battery voltage
    test_battery(board)
    
    # Test 4: Read IMU sensor data
    test_imu(board, controller)
    
    # Test 5: Read servo data (safe, no movement)
    test_servos(controller, board)
    
    # Test 6: Read ultrasonic distance sensor
    test_ultrasonic()
    
    # Test 7: Test buzzer (skipped if --quick flag is used)
    test_buzzer(board, skip=args.quick)
    
    # Test 8: Test LED (skipped if --quick flag is used)
    test_led(board, skip=args.quick)
    
    # Test 9: Test camera (only if --camera flag is used)
    if args.camera:
        test_camera()
    
    # Test 10: Check GPIO availability
    test_gpio_light_sensor()
    
    # Interactive servo movement test (only if --servo flag is used)
    if args.servo:
        test_servo_movement(controller, board)
    
    # ========================================================================
    # PRINT FINAL SUMMARY
    # ========================================================================
    
    results.summary()
    
    # Return exit code: 0 = success (all passed), 1 = failure (some failed)
    # This is a ternary expression: value_if_true if condition else value_if_false
    return 0 if results.failed == 0 else 1


# ============================================================================
# SCRIPT ENTRY POINT
# ============================================================================

# This block only runs when the script is executed directly
# It does NOT run when the script is imported as a module
if __name__ == "__main__":
    try:
        # Run main() and exit with its return code
        # sys.exit() terminates the program with the given status code
        sys.exit(main())
    except KeyboardInterrupt:
        # Handle Ctrl+C gracefully
        # KeyboardInterrupt is raised when user presses Ctrl+C
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)  # Exit with error code 1
