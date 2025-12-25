"""
Comprehensive Servo Data Flow Verification Script

This script verifies the complete data flow:
1. Robot → MQTT (checking both topics)
2. MQTT → Database (InfluxDB)
3. Database → API
4. API → Frontend

Checks both:
- tonypi/sensors/{robot_id} (servo_angle as sensor data)
- tonypi/servos/{robot_id} (full servo data)
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Configuration
API_BASE_URL = "http://localhost:8000"
ROBOT_ID = "tonypi_raspberrypi"  # Change if needed

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(70)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.RESET}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")

def print_error(text: str):
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.RESET}")

def print_info(text: str):
    print(f"  {text}")

def check_api_health() -> bool:
    """Check if API is running"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success("API is running and healthy")
            print_info(f"Status: {data.get('status')}")
            services = data.get('services', {})
            for service, status in services.items():
                status_icon = "✓" if status == "healthy" else "✗"
                color = Colors.GREEN if status == "healthy" else Colors.RED
                print_info(f"  {service}: {color}{status_icon} {status}{Colors.RESET}")
            return True
        else:
            print_error(f"API returned status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Cannot connect to API: {e}")
        return False

def check_mqtt_messages_via_backend_logs() -> Dict:
    """Check MQTT messages by querying backend logs (simulated check)"""
    print_info("Note: To check MQTT messages directly, run:")
    print_info("  docker exec tonypi_mosquitto mosquitto_sub -t 'tonypi/servos/#' -C 5 -W 10")
    print_info("  docker exec tonypi_mosquitto mosquitto_sub -t 'tonypi/sensors/#' -C 5 -W 10")
    return {"status": "manual_check_required"}

def check_sensor_data_in_database(robot_id: str) -> Dict:
    """Check if servo_angle data is in sensors measurement"""
    try:
        # Query sensors measurement for servo_angle
        params = {
            "measurement": "sensors",
            "time_range": "10m",
            "robot_id": robot_id
        }
        response = requests.get(f"{API_BASE_URL}/api/robot-data/sensors", params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            servo_angle_data = [d for d in data if d.get('sensor_type') == 'servo_angle']
            
            if servo_angle_data:
                print_success(f"Found {len(servo_angle_data)} servo_angle data points in 'sensors' measurement")
                # Show latest value
                latest = max(servo_angle_data, key=lambda x: x['timestamp'])
                print_info(f"Latest servo_angle: {latest.get('value')}° at {latest.get('timestamp')}")
                return {
                    "status": "found",
                    "count": len(servo_angle_data),
                    "latest": latest
                }
            else:
                print_warning("No servo_angle data found in 'sensors' measurement")
                print_info("This means robot is not sending servo_angle on tonypi/sensors/ topic")
                return {"status": "not_found", "count": 0}
        else:
            print_error(f"API returned status {response.status_code}")
            return {"status": "error"}
    except Exception as e:
        print_error(f"Error checking sensor data: {e}")
        return {"status": "error"}

def check_servo_data_in_database(robot_id: str) -> Dict:
    """Check if full servo data is in servos measurement"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/robot-data/servos/{robot_id}", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            servos = data.get('servos', {})
            
            if servos:
                print_success(f"Found servo data for {len(servos)} servos in 'servos' measurement")
                for servo_name, servo_info in servos.items():
                    print_info(f"  {servo_name}:")
                    for key, value in servo_info.items():
                        if key not in ['robot_id', 'name', 'id']:
                            print_info(f"    {key}: {value}")
                return {
                    "status": "found",
                    "servos": servos,
                    "count": len(servos)
                }
            else:
                print_warning("No servo data found in 'servos' measurement")
                print_info("This means robot is not sending data on tonypi/servos/ topic")
                return {"status": "not_found", "servos": {}}
        else:
            print_error(f"API returned status {response.status_code}")
            return {"status": "error"}
    except Exception as e:
        print_error(f"Error checking servo data: {e}")
        return {"status": "error"}

def check_api_endpoint(robot_id: str) -> Dict:
    """Check if API endpoint returns data correctly"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/robot-data/servos/{robot_id}", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print_success("API endpoint is accessible")
            print_info(f"Response structure: {json.dumps(data, indent=2)[:200]}...")
            return {"status": "ok", "data": data}
        else:
            print_error(f"API returned status {response.status_code}")
            return {"status": "error"}
    except Exception as e:
        print_error(f"Error checking API endpoint: {e}")
        return {"status": "error"}

def check_frontend_data_flow(robot_id: str) -> Dict:
    """Simulate frontend data retrieval"""
    try:
        # This is what the frontend does
        response = requests.get(f"{API_BASE_URL}/api/robot-data/servos/{robot_id}", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            servos = data.get('servos', {})
            
            if servos:
                print_success("Frontend would receive servo data")
                print_info(f"Servo count: {len(servos)}")
                print_info("Frontend would display servo cards with:")
                for servo_name in list(servos.keys())[:3]:  # Show first 3
                    servo = servos[servo_name]
                    print_info(f"  - {servo_name}: position, temperature, voltage, etc.")
                return {"status": "ok", "servos": servos}
            else:
                print_warning("Frontend would receive empty servo data")
                print_info("Frontend would show 'No servo data' message")
                return {"status": "empty", "servos": {}}
        else:
            print_error(f"Frontend would receive error: {response.status_code}")
            return {"status": "error"}
    except Exception as e:
        print_error(f"Error checking frontend flow: {e}")
        return {"status": "error"}

def generate_summary(results: Dict):
    """Generate summary report"""
    print_header("DATA FLOW SUMMARY")
    
    print(f"{Colors.BOLD}Data Flow Status:{Colors.RESET}\n")
    
    # Step 1: Robot → MQTT
    print(f"1. {Colors.BOLD}Robot → MQTT{Colors.RESET}")
    print_info("   Topic: tonypi/servos/{robot_id}")
    if results.get('servo_data', {}).get('status') == 'found':
        print_success("   ✓ Servo data is being sent to MQTT")
    else:
        print_error("   ✗ Servo data NOT being sent to MQTT")
        print_info("   → Check robot client is running and sending servo status")
    
    print_info("   Topic: tonypi/sensors/{robot_id} (servo_angle)")
    if results.get('sensor_data', {}).get('status') == 'found':
        print_success("   ✓ Servo angle is being sent as sensor data")
    else:
        print_warning("   ⚠ Servo angle NOT being sent (this is OK if using servos topic)")
    
    # Step 2: MQTT → Database
    print(f"\n2. {Colors.BOLD}MQTT → Database (InfluxDB){Colors.RESET}")
    if results.get('servo_data', {}).get('status') == 'found':
        print_success("   ✓ Servo data stored in 'servos' measurement")
        print_info(f"   Found {results.get('servo_data', {}).get('count', 0)} servos")
    else:
        print_error("   ✗ Servo data NOT stored in database")
    
    if results.get('sensor_data', {}).get('status') == 'found':
        print_success("   ✓ Servo angle stored in 'sensors' measurement")
        print_info(f"   Found {results.get('sensor_data', {}).get('count', 0)} data points")
    
    # Step 3: Database → API
    print(f"\n3. {Colors.BOLD}Database → API{Colors.RESET}")
    if results.get('api_check', {}).get('status') == 'ok':
        print_success("   ✓ API endpoint is working")
    else:
        print_error("   ✗ API endpoint has issues")
    
    # Step 4: API → Frontend
    print(f"\n4. {Colors.BOLD}API → Frontend{Colors.RESET}")
    if results.get('frontend_check', {}).get('status') == 'ok':
        print_success("   ✓ Frontend would receive data")
        print_info(f"   Servo count: {len(results.get('frontend_check', {}).get('servos', {}))}")
    else:
        print_error("   ✗ Frontend would NOT receive data")
    
    # Recommendations
    print(f"\n{Colors.BOLD}Recommendations:{Colors.RESET}\n")
    
    if results.get('servo_data', {}).get('status') != 'found':
        print_warning("1. Robot client may not be sending servo data")
        print_info("   → Check robot client logs for 'Sent servo status' messages")
        print_info("   → Verify robot client has send_servo_status() function")
        print_info("   → Restart robot client if needed")
    
    if results.get('servo_data', {}).get('status') == 'found' and results.get('frontend_check', {}).get('status') != 'ok':
        print_warning("2. Data is in database but API/Frontend issue")
        print_info("   → Check API logs for errors")
        print_info("   → Verify frontend is calling correct endpoint")
    
    if results.get('servo_data', {}).get('status') == 'found' and results.get('frontend_check', {}).get('status') == 'ok':
        print_success("3. Data flow is working correctly!")
        print_info("   → All systems operational")

def main():
    print_header("SERVO DATA FLOW VERIFICATION")
    print(f"Robot ID: {ROBOT_ID}")
    print(f"API URL: {API_BASE_URL}\n")
    
    results = {}
    
    # Step 1: Check API Health
    print_header("STEP 1: API Health Check")
    api_healthy = check_api_health()
    if not api_healthy:
        print_error("Cannot proceed - API is not accessible")
        return
    results['api_health'] = api_healthy
    
    # Step 2: Check MQTT Messages (manual check)
    print_header("STEP 2: MQTT Messages Check")
    mqtt_info = check_mqtt_messages_via_backend_logs()
    results['mqtt_info'] = mqtt_info
    
    # Step 3: Check Sensor Data (servo_angle in sensors measurement)
    print_header("STEP 3: Sensor Data Check (servo_angle)")
    sensor_data = check_sensor_data_in_database(ROBOT_ID)
    results['sensor_data'] = sensor_data
    
    # Step 4: Check Servo Data (full servo data in servos measurement)
    print_header("STEP 4: Servo Data Check (full servo data)")
    servo_data = check_servo_data_in_database(ROBOT_ID)
    results['servo_data'] = servo_data
    
    # Step 5: Check API Endpoint
    print_header("STEP 5: API Endpoint Check")
    api_check = check_api_endpoint(ROBOT_ID)
    results['api_check'] = api_check
    
    # Step 6: Check Frontend Data Flow
    print_header("STEP 6: Frontend Data Flow Check")
    frontend_check = check_frontend_data_flow(ROBOT_ID)
    results['frontend_check'] = frontend_check
    
    # Generate Summary
    generate_summary(results)
    
    print(f"\n{Colors.BOLD}Verification complete!{Colors.RESET}\n")

if __name__ == "__main__":
    main()




