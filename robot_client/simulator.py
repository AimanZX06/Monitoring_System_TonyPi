#!/usr/bin/env python3
"""
TonyPi Robot Simulator
Simulates a TonyPi robot for testing the monitoring system
Run this instead of the real robot client for development/testing
"""

import asyncio
import sys
import os

# Add the robot_client directory to the path so we can import tonypi_client
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tonypi_client import TonyPiRobotClient
import logging
import random
import math
import time
import json
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger("TonyPi-Simulator")

class TonyPiSimulator(TonyPiRobotClient):
    """Enhanced TonyPi client with realistic simulation"""
    
    def __init__(self, mqtt_broker: str = "localhost", mqtt_port: int = 1883):
        super().__init__(mqtt_broker, mqtt_port)
        
        # Enhanced simulation state
        self.battery_level = random.uniform(60.0, 100.0)  # Start with random battery
        self.location = {"x": 0.0, "y": 0.0, "z": 0.0}
        self.heading = 0.0  # Robot orientation in degrees
        self.is_moving = False
        self.movement_speed = 0.0
        self.last_movement_time = time.time()
        
        # Simulation parameters
        self.simulate_realistic_sensors = True
        self.simulate_drift = True
        self.battery_drain_rate = 0.002  # Battery drain per second when active
        
        logger.info("TonyPi Simulator initialized with realistic behavior")

    def get_cpu_temperature(self) -> float:
        """Simulate CPU temperature with realistic variation"""
        base_temp = 45.0
        variation = 10.0 * math.sin(time.time() / 30.0)  # Slow oscillation
        load_factor = self.movement_speed * 5.0  # Temperature rises with activity
        return base_temp + variation + load_factor

    def read_sensors(self) -> Dict[str, float]:
        """Enhanced sensor simulation with realistic physics"""
        current_time = time.time()
        
        if self.simulate_realistic_sensors:
            # Realistic accelerometer (includes gravity and movement)
            accel_x = 0.0
            accel_y = 0.0
            accel_z = 9.81  # Gravity
            
            if self.is_moving:
                # Add movement acceleration
                accel_x += self.movement_speed * math.cos(math.radians(self.heading)) * 0.5
                accel_y += self.movement_speed * math.sin(math.radians(self.heading)) * 0.5
            
            # Add some noise
            accel_x += random.uniform(-0.1, 0.1)
            accel_y += random.uniform(-0.1, 0.1)
            accel_z += random.uniform(-0.2, 0.2)
            
            # Realistic gyroscope (rotation rates)
            gyro_x = random.uniform(-2.0, 2.0)  # Small random movements
            gyro_y = random.uniform(-2.0, 2.0)
            gyro_z = random.uniform(-5.0, 5.0)  # Yaw movement
            
            # Ultrasonic distance sensor (simulate obstacles)
            base_distance = 150.0
            obstacle_factor = 50.0 * (1 + math.sin(current_time / 10.0))  # Moving obstacles
            ultrasonic_distance = base_distance - obstacle_factor + random.uniform(-10.0, 10.0)
            ultrasonic_distance = max(5.0, min(200.0, ultrasonic_distance))
            
            # Camera light level (simulates day/night cycle)
            time_of_day = (current_time % 86400) / 86400  # 0-1 representing 24 hours
            light_cycle = 50.0 + 45.0 * math.sin(2 * math.pi * time_of_day)  # Day/night cycle
            camera_light_level = max(0.0, min(100.0, light_cycle + random.uniform(-10.0, 10.0)))
            
            # Servo angle (simulate head/camera movement)
            servo_angle = 30.0 * math.sin(current_time / 8.0)  # Slow scanning movement
            
        else:
            # Simple random sensors
            accel_x = random.uniform(-2.0, 2.0)
            accel_y = random.uniform(-2.0, 2.0)
            accel_z = random.uniform(8.0, 12.0)
            gyro_x = random.uniform(-100, 100)
            gyro_y = random.uniform(-100, 100)
            gyro_z = random.uniform(-100, 100)
            ultrasonic_distance = random.uniform(5.0, 200.0)
            camera_light_level = random.uniform(0.0, 100.0)
            servo_angle = random.uniform(-90, 90)
        
        sensors = {
            "accelerometer_x": round(accel_x, 3),
            "accelerometer_y": round(accel_y, 3),
            "accelerometer_z": round(accel_z, 3),
            "gyroscope_x": round(gyro_x, 2),
            "gyroscope_y": round(gyro_y, 2),
            "gyroscope_z": round(gyro_z, 2),
            "ultrasonic_distance": round(ultrasonic_distance, 1),
            "camera_light_level": round(camera_light_level, 1),
            "servo_angle": round(servo_angle, 1),
            "cpu_temperature": round(self.get_cpu_temperature(), 1)
        }
        
        self.sensors = sensors
        return sensors

    def handle_move_command(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Enhanced movement simulation with realistic physics"""
        try:
            direction = payload.get("direction", "forward")
            distance = payload.get("distance", 1.0)
            speed = payload.get("speed", 0.5)
            
            logger.info(f"Simulating movement: {direction} for {distance} units at speed {speed}")
            
            # Convert direction to heading change
            if direction == "forward":
                pass  # No heading change
            elif direction == "backward":
                distance = -distance  # Negative distance for backward
            elif direction == "left":
                self.heading = (self.heading - 90) % 360
            elif direction == "right":
                self.heading = (self.heading + 90) % 360
            elif direction == "rotate_left":
                self.heading = (self.heading - distance) % 360
                distance = 0  # No linear movement for rotation
            elif direction == "rotate_right":
                self.heading = (self.heading + distance) % 360
                distance = 0
            
            # Update position based on heading and distance
            if distance != 0:
                self.location["x"] += distance * math.cos(math.radians(self.heading))
                self.location["y"] += distance * math.sin(math.radians(self.heading))
            
            # Simulate movement duration
            self.is_moving = True
            self.movement_speed = speed
            self.last_movement_time = time.time()
            
            # Simulate battery consumption (more realistic)
            battery_consumption = abs(distance) * 0.1 + speed * 0.05
            self.battery_level = max(0, self.battery_level - battery_consumption)
            
            # Add some drift to simulate real-world conditions
            if self.simulate_drift:
                drift_x = random.uniform(-0.1, 0.1)
                drift_y = random.uniform(-0.1, 0.1)
                self.location["x"] += drift_x
                self.location["y"] += drift_y
            
            return {
                "robot_id": self.robot_id,
                "command_id": payload.get("id"),
                "timestamp": datetime.now().isoformat(),
                "success": True,
                "message": f"Simulated movement: {direction} for {distance} units at speed {speed}",
                "new_location": self.location.copy(),
                "heading": self.heading,
                "battery_level": self.battery_level
            }
            
        except Exception as e:
            return {
                "robot_id": self.robot_id,
                "command_id": payload.get("id"),
                "timestamp": datetime.now().isoformat(),
                "success": False,
                "message": f"Movement simulation failed: {str(e)}"
            }

    def get_servo_status(self) -> Dict[str, Any]:
        """Simulate servo status data"""
        import random
        servo_data = {}
        
        # Simulate 6 servos
        servo_names = [
            "servo_1_left_front",
            "servo_2_left_rear", 
            "servo_3_right_front",
            "servo_4_right_rear",
            "servo_5_head_pan",
            "servo_6_head_tilt"
        ]
        
        for idx, servo_name in enumerate(servo_names, 1):
            temp = random.uniform(35.0, 65.0)
            alert_level = "normal"
            if temp > 70:
                alert_level = "critical"
            elif temp > 60:
                alert_level = "warning"
            
            servo_data[servo_name] = {
                "id": idx,
                "name": servo_name,
                "position": round(random.uniform(-90, 90), 1),
                "temperature": round(temp, 1),
                "voltage": round(random.uniform(4.8, 5.2), 2),
                "torque_enabled": random.choice([True, True, True, False]),  # Mostly enabled
                "alert_level": alert_level
            }
        
        return servo_data
    
    def send_servo_status(self):
        """Send servo status to MQTT"""
        if not self.is_connected:
            return
        
        try:
            servo_data = self.get_servo_status()
            servo_topic = f"tonypi/servos/{self.robot_id}"
            
            payload = {
                "robot_id": self.robot_id,
                "timestamp": datetime.now().isoformat(),
                "servos": servo_data
            }
            
            self.client.publish(servo_topic, json.dumps(payload))
            logger.info(f"Sent servo status: {len(servo_data)} servos to {servo_topic}")
            
        except Exception as e:
            logger.error(f"Error sending servo status: {e}")

    async def run(self):
        """Enhanced main loop with realistic behavior"""
        self.running = True  # IMPORTANT: Set running flag
        logger.info(f"Starting TonyPi Robot Simulator - ID: {self.robot_id}")
        logger.info(f"Connecting to MQTT broker at {self.mqtt_broker}:{self.mqtt_port}")
        
        # Override some simulation parameters based on startup
        self.simulate_realistic_sensors = True
        self.simulate_drift = True
        
        # Stop movement after some time
        async def stop_movement_after_delay():
            while self.running:
                if self.is_moving and (time.time() - self.last_movement_time) > 3.0:
                    self.is_moving = False
                    self.movement_speed = 0.0
                await asyncio.sleep(1)
        
        # Start the movement timer task
        movement_task = asyncio.create_task(stop_movement_after_delay())
        
        try:
            # Connect first
            await self.connect()
            
            # Wait for connection
            timeout = 10
            while not self.is_connected and timeout > 0:
                await asyncio.sleep(0.5)
                timeout -= 0.5
            
            if not self.is_connected:
                raise Exception("Failed to connect to MQTT broker")
            
            logger.info("✅ Successfully connected to MQTT broker")
            print("✅ Successfully connected to MQTT broker")
            
            # Send initial status update immediately
            self.send_status_update()
            print("📡 Sending initial status...")
            
            # Main loop with data sending
            last_sensor_time = 0
            last_battery_time = 0
            last_location_time = 0
            last_status_time = time.time()  # Just sent status
            last_servo_time = 0
            
            print("🔄 Starting main data loop...")
            loop_count = 0
            
            while self.running:
                current_time = time.time()
                loop_count += 1
                
                # Send sensor data every 2 seconds
                if current_time - last_sensor_time >= 2:
                    self.send_sensor_data()
                    last_sensor_time = current_time
                    print(f"📊 Sent sensor data (loop #{loop_count})")
                
                # Send battery status every 30 seconds
                if current_time - last_battery_time >= 30:
                    self.send_battery_status()
                    last_battery_time = current_time
                
                # Send location every 5 seconds
                if current_time - last_location_time >= 5:
                    self.send_location_update()
                    last_location_time = current_time
                
                # Send status every 60 seconds
                if current_time - last_status_time >= 60:
                    self.send_status_update()
                    last_status_time = current_time
                
                # Send servo status every 5 seconds
                if current_time - last_servo_time >= 5:
                    self.send_servo_status()
                    last_servo_time = current_time
                    print(f"🔧 Sent servo data")
                
                # Simulate battery drain
                if self.battery_level > 0:
                    self.battery_level = max(0, self.battery_level - 0.001)
                
                await asyncio.sleep(0.1)
                
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
        except Exception as e:
            logger.error(f"Error in simulator loop: {e}")
        finally:
            movement_task.cancel()
            await self.disconnect()

def main():
    """Main entry point for simulator"""
    import argparse
    
    parser = argparse.ArgumentParser(description="TonyPi Robot Simulator")
    parser.add_argument("--broker", default="localhost", help="MQTT broker address")
    parser.add_argument("--port", type=int, default=1883, help="MQTT broker port")
    parser.add_argument("--realistic", action="store_true", default=True, 
                       help="Use realistic sensor simulation")
    parser.add_argument("--drift", action="store_true", default=True,
                       help="Simulate movement drift")
    
    args = parser.parse_args()
    
    simulator = TonyPiSimulator(mqtt_broker=args.broker, mqtt_port=args.port)
    simulator.simulate_realistic_sensors = args.realistic
    simulator.simulate_drift = args.drift
    
    print("🤖 TonyPi Robot Simulator Starting...")
    print(f"📡 MQTT Broker: {args.broker}:{args.port}")
    print(f"🎯 Realistic Sensors: {args.realistic}")
    print(f"🌊 Movement Drift: {args.drift}")
    print("Press Ctrl+C to stop the simulator")
    
    try:
        asyncio.run(simulator.run())
    except KeyboardInterrupt:
        print("\n🛑 Simulator stopped by user")
    except Exception as e:
        print(f"❌ Simulator error: {e}")

if __name__ == "__main__":
    main()