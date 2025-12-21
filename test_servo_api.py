#!/usr/bin/env python3
"""
Test script to check servo data flow
"""
import requests
import json
from datetime import datetime

API_BASE = "http://localhost:8000/api"

def test_robot_status():
    """Test if robots are connected"""
    print("=" * 60)
    print("1. Testing Robot Status")
    print("=" * 60)
    try:
        response = requests.get(f"{API_BASE}/robot-data/status")
        if response.status_code == 200:
            robots = response.json()
            print(f"[OK] Found {len(robots)} robot(s):")
            for robot in robots:
                print(f"   - {robot.get('robot_id')}: {robot.get('status')}")
            return robots
        else:
            print(f"[ERROR] Error: {response.status_code}")
            return []
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        return []

def test_servo_api(robot_id):
    """Test servo data API"""
    print("\n" + "=" * 60)
    print(f"2. Testing Servo Data API for {robot_id}")
    print("=" * 60)
    try:
        response = requests.get(f"{API_BASE}/robot-data/servos/{robot_id}?time_range=1h")
        if response.status_code == 200:
            data = response.json()
            print(f"[OK] API Response:")
            print(json.dumps(data, indent=2))
            
            if data.get("servos"):
                print(f"\n[OK] Found {len(data['servos'])} servos")
                for name, servo in data["servos"].items():
                    print(f"   - {name}: {servo}")
            else:
                print("\n[WARNING] No servo data in response")
                if "message" in data:
                    print(f"   Message: {data['message']}")
            
            return data
        else:
            print(f"[ERROR] Error: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        return None

def test_influxdb_direct():
    """Test InfluxDB query directly"""
    print("\n" + "=" * 60)
    print("3. Testing InfluxDB Query (via API)")
    print("=" * 60)
    try:
        # Try to get raw sensor data
        response = requests.get(
            f"{API_BASE}/robot-data/sensors",
            params={
                "measurement": "servos",
                "time_range": "1h"
            }
        )
        if response.status_code == 200:
            data = response.json()
            print(f"[OK] Found {len(data)} servo data points in InfluxDB")
            if data:
                print("\nSample data points:")
                for item in data[:5]:
                    print(f"   - {item.get('field')}: {item.get('value')} (robot: {item.get('robot_id')})")
            else:
                print("[WARNING] No servo data in InfluxDB")
            return data
        else:
            print(f"[ERROR] Error: {response.status_code}")
            return []
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        return []

def main():
    print("\n" + "=" * 60)
    print("SERVO DATA FLOW DIAGNOSTIC")
    print("=" * 60)
    print(f"Time: {datetime.now().isoformat()}")
    print()
    
    # Test 1: Robot status
    robots = test_robot_status()
    
    if not robots:
        print("\n[ERROR] No robots found. Make sure robot client is running!")
        return
    
    # Test 2: Servo API for each robot
    for robot in robots:
        robot_id = robot.get("robot_id")
        if robot_id:
            test_servo_api(robot_id)
    
    # Test 3: InfluxDB direct
    test_influxdb_direct()
    
    print("\n" + "=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60)
    print("\nTroubleshooting:")
    print("1. If no robots: Start robot client on Raspberry Pi")
    print("2. If no servo data: Check robot client logs for 'Sent servo status'")
    print("3. If API returns empty: Check backend logs for MQTT messages")
    print("4. If InfluxDB empty: Check backend MQTT handler is working")
    print()

if __name__ == "__main__":
    main()
