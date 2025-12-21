#!/usr/bin/env python3
"""
Check database connections via API and Docker
"""
import requests
import subprocess
import json
from datetime import datetime

API_BASE = "http://localhost:8000/api"

def check_docker_services():
    """Check if Docker services are running"""
    print("=" * 60)
    print("1. Checking Docker Services")
    print("=" * 60)
    
    try:
        result = subprocess.run(
            ["docker-compose", "ps"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            services = {
                "influxdb": False,
                "postgres": False,
                "backend": False
            }
            for line in result.stdout.split('\n'):
                for service in services.keys():
                    if service in line.lower() and "up" in line.lower():
                        services[service] = True
                        status = line.split()[1] if len(line.split()) > 1 else "Unknown"
                        print(f"[OK] {service}: {status}")
            
            for service, running in services.items():
                if not running:
                    print(f"[ERROR] {service}: Not running")
            
            return all(services.values())
        else:
            print(f"[ERROR] docker-compose ps failed")
            return False
    except Exception as e:
        print(f"[ERROR] Cannot check Docker services: {e}")
        return False

def check_influxdb_via_docker():
    """Check InfluxDB via Docker exec"""
    print("\n" + "=" * 60)
    print("2. Checking InfluxDB Connection")
    print("=" * 60)
    
    try:
        # Check if InfluxDB is accessible
        result = subprocess.run(
            ["docker", "exec", "tonypi_influxdb", "influx", "ping"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print("[OK] InfluxDB container is accessible")
        else:
            print(f"[WARNING] InfluxDB ping failed: {result.stderr}")
    except Exception as e:
        print(f"[WARNING] Cannot ping InfluxDB: {e}")
    
    # Check InfluxDB logs
    try:
        result = subprocess.run(
            ["docker-compose", "logs", "influxdb", "--tail=5"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if "ready" in result.stdout.lower() or "listening" in result.stdout.lower():
            print("[OK] InfluxDB appears to be ready")
        else:
            print("[INFO] Check InfluxDB logs for details")
    except Exception as e:
        print(f"[WARNING] Cannot check InfluxDB logs: {e}")

def check_postgres_via_docker():
    """Check PostgreSQL via Docker exec"""
    print("\n" + "=" * 60)
    print("3. Checking PostgreSQL Connection")
    print("=" * 60)
    
    try:
        # Check if PostgreSQL is accessible
        result = subprocess.run(
            ["docker", "exec", "tonypi_postgres", "pg_isready", "-U", "tonypi"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print("[OK] PostgreSQL is ready and accepting connections")
            print(f"     {result.stdout.strip()}")
        else:
            print(f"[WARNING] PostgreSQL not ready: {result.stderr}")
    except Exception as e:
        print(f"[WARNING] Cannot check PostgreSQL: {e}")
    
    # Check PostgreSQL logs
    try:
        result = subprocess.run(
            ["docker-compose", "logs", "postgres", "--tail=5"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if "ready" in result.stdout.lower() or "listening" in result.stdout.lower():
            print("[OK] PostgreSQL appears to be ready")
        else:
            print("[INFO] Check PostgreSQL logs for details")
    except Exception as e:
        print(f"[WARNING] Cannot check PostgreSQL logs: {e}")

def check_backend_api():
    """Check backend API endpoints"""
    print("\n" + "=" * 60)
    print("4. Checking Backend API")
    print("=" * 60)
    
    # Health check
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code == 200:
            print("[OK] Backend API is responding")
            print(f"     Health: {response.json()}")
        else:
            print(f"[WARNING] Backend health check: Status {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Backend API not responding: {e}")
        return False
    
    # Robot status (uses PostgreSQL)
    try:
        response = requests.get(f"{API_BASE}/robot-data/status", timeout=5)
        if response.status_code == 200:
            robots = response.json()
            print(f"[OK] Robot status API: {len(robots)} robots found")
            print(f"     (This uses PostgreSQL)")
            if robots:
                for robot in robots[:3]:
                    print(f"     - {robot.get('robot_id')}: {robot.get('status')}")
        else:
            print(f"[WARNING] Robot status API: Status {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Robot status API failed: {e}")
    
    # Servo data (uses InfluxDB)
    try:
        response = requests.get(f"{API_BASE}/robot-data/servos/tonypi_raspberrypi?time_range=1h", timeout=5)
        if response.status_code == 200:
            data = response.json()
            servo_count = len(data.get("servos", {}))
            if servo_count > 0:
                print(f"[OK] Servo data API: {servo_count} servos found")
                print(f"     (This uses InfluxDB)")
            else:
                print(f"[WARNING] Servo data API: No servo data (InfluxDB may be empty)")
                print(f"     Message: {data.get('message', 'N/A')}")
        else:
            print(f"[WARNING] Servo data API: Status {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Servo data API failed: {e}")
    
    # Sensor data (uses InfluxDB)
    try:
        response = requests.get(f"{API_BASE}/robot-data/sensors?measurement=sensors&time_range=5m", timeout=5)
        if response.status_code == 200:
            sensors = response.json()
            print(f"[OK] Sensor data API: {len(sensors)} data points found")
            print(f"     (This uses InfluxDB)")
            if sensors:
                # Group by field
                fields = {}
                for sensor in sensors:
                    field = sensor.get('field', 'unknown')
                    fields[field] = fields.get(field, 0) + 1
                for field, count in list(fields.items())[:5]:
                    print(f"     - {field}: {count} points")
        else:
            print(f"[WARNING] Sensor data API: Status {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Sensor data API failed: {e}")
    
    return True

def check_influxdb_data_direct():
    """Try to query InfluxDB directly via Docker"""
    print("\n" + "=" * 60)
    print("5. Checking InfluxDB Data (Direct Query)")
    print("=" * 60)
    
    # This would require InfluxDB CLI or API access
    print("[INFO] To check InfluxDB data directly:")
    print("       1. Open: http://localhost:8086")
    print("       2. Login with token from .env file")
    print("       3. Check bucket: robot_data")
    print("       4. Look for measurements: sensors, servos, battery, etc.")

def check_postgres_data_direct():
    """Try to query PostgreSQL directly via Docker"""
    print("\n" + "=" * 60)
    print("6. Checking PostgreSQL Data (Direct Query)")
    print("=" * 60)
    
    try:
        # Try to query via docker exec
        query = "SELECT COUNT(*) FROM robots;"
        result = subprocess.run(
            ["docker", "exec", "tonypi_postgres", "psql", "-U", "tonypi", "-d", "tonypi_db", "-c", query],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print("[OK] PostgreSQL query successful")
            print(result.stdout)
        else:
            print(f"[WARNING] PostgreSQL query failed: {result.stderr}")
    except Exception as e:
        print(f"[INFO] Cannot query PostgreSQL directly: {e}")
        print("[INFO] To check PostgreSQL data directly:")
        print("       1. docker exec -it tonypi_postgres psql -U tonypi -d tonypi_db")
        print("       2. \\dt (list tables)")
        print("       3. SELECT * FROM robots;")

def main():
    print("\n" + "=" * 60)
    print("DATABASE CONNECTION DIAGNOSTIC")
    print("=" * 60)
    print(f"Time: {datetime.now().isoformat()}")
    print()
    
    # Check Docker services
    docker_ok = check_docker_services()
    
    if docker_ok:
        # Check databases
        check_influxdb_via_docker()
        check_postgres_via_docker()
        
        # Check API (which uses both databases)
        api_ok = check_backend_api()
        
        # Direct checks
        check_influxdb_data_direct()
        check_postgres_data_direct()
    else:
        print("\n[ERROR] Docker services not running. Start with: docker-compose up -d")
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print("To verify database connections:")
    print("1. Check Docker services are running (above)")
    print("2. Check API endpoints return data (above)")
    print("3. If API returns data, databases are connected!")
    print()
    print("If InfluxDB is empty:")
    print("- Robot client needs to send data to tonypi/servos/{robot_id}")
    print("- Check backend logs: docker-compose logs backend | findstr servos")
    print()
    print("If PostgreSQL is empty:")
    print("- Robots will be created when they connect")
    print("- Check: docker exec -it tonypi_postgres psql -U tonypi -d tonypi_db -c 'SELECT * FROM robots;'")
    print()

if __name__ == "__main__":
    main()
