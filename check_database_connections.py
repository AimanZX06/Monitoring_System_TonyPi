#!/usr/bin/env python3
"""
Diagnostic script to check InfluxDB and PostgreSQL connections
"""
import requests
import os
from datetime import datetime

# Try to import database clients
try:
    from backend.database.influx_client import influx_client
    INFLUX_AVAILABLE = True
except Exception as e:
    INFLUX_AVAILABLE = False
    INFLUX_ERROR = str(e)

try:
    from backend.database.database import SessionLocal, engine
    from backend.models.robot import Robot
    from backend.models.job import Job
    from backend.models.report import Report
    from backend.models.system_log import SystemLog
    POSTGRES_AVAILABLE = True
except Exception as e:
    POSTGRES_AVAILABLE = False
    POSTGRES_ERROR = str(e)

API_BASE = "http://localhost:8000/api"

def check_influxdb_connection():
    """Check InfluxDB connection"""
    print("=" * 60)
    print("1. Checking InfluxDB Connection")
    print("=" * 60)
    
    if not INFLUX_AVAILABLE:
        print(f"[ERROR] Cannot import InfluxDB client: {INFLUX_ERROR}")
        return False
    
    try:
        # Try to query InfluxDB
        data = influx_client.query_recent_data("sensors", "5m")
        print(f"[OK] InfluxDB client imported successfully")
        print(f"[OK] Connection test: Query returned {len(data)} data points")
        
        # Check configuration
        print(f"\nInfluxDB Configuration:")
        print(f"  URL: {influx_client.url}")
        print(f"  Org: {influx_client.org}")
        print(f"  Bucket: {influx_client.bucket}")
        
        return True
    except Exception as e:
        print(f"[ERROR] InfluxDB connection failed: {e}")
        return False

def check_influxdb_data():
    """Check what data is in InfluxDB"""
    print("\n" + "=" * 60)
    print("2. Checking InfluxDB Data")
    print("=" * 60)
    
    if not INFLUX_AVAILABLE:
        print("[SKIP] InfluxDB client not available")
        return
    
    measurements = ["sensors", "servos", "battery", "location", "robot_status", "pi_perf"]
    
    for measurement in measurements:
        try:
            data = influx_client.query_recent_data(measurement, "1h")
            count = len(data)
            if count > 0:
                print(f"[OK] {measurement}: {count} data points")
                # Show sample
                if data:
                    sample = data[0]
                    print(f"      Sample: {sample.get('field')} = {sample.get('value')} (robot: {sample.get('robot_id', 'N/A')})")
            else:
                print(f"[EMPTY] {measurement}: No data")
        except Exception as e:
            print(f"[ERROR] {measurement}: {e}")

def check_postgres_connection():
    """Check PostgreSQL connection"""
    print("\n" + "=" * 60)
    print("3. Checking PostgreSQL Connection")
    print("=" * 60)
    
    if not POSTGRES_AVAILABLE:
        print(f"[ERROR] Cannot import PostgreSQL client: {POSTGRES_ERROR}")
        return False
    
    try:
        db = SessionLocal()
        # Try a simple query
        robot_count = db.query(Robot).count()
        print(f"[OK] PostgreSQL connection successful")
        print(f"[OK] Database query test: Found {robot_count} robots")
        
        # Check connection string (hide password)
        conn_str = str(engine.url).split('@')
        if len(conn_str) > 1:
            print(f"\nPostgreSQL Configuration:")
            print(f"  Host: {conn_str[1]}")
            print(f"  Database: {engine.url.database}")
            print(f"  Username: {engine.url.username}")
        
        db.close()
        return True
    except Exception as e:
        print(f"[ERROR] PostgreSQL connection failed: {e}")
        return False

def check_postgres_data():
    """Check what data is in PostgreSQL"""
    print("\n" + "=" * 60)
    print("4. Checking PostgreSQL Data")
    print("=" * 60)
    
    if not POSTGRES_AVAILABLE:
        print("[SKIP] PostgreSQL client not available")
        return
    
    try:
        db = SessionLocal()
        
        # Check robots
        robots = db.query(Robot).all()
        print(f"[OK] Robots: {len(robots)}")
        for robot in robots[:5]:  # Show first 5
            print(f"      - {robot.robot_id}: {robot.status} (last seen: {robot.last_seen})")
        
        # Check jobs
        jobs = db.query(Job).all()
        print(f"[OK] Jobs: {len(jobs)}")
        for job in jobs[:5]:  # Show first 5
            print(f"      - Job {job.id}: {job.status} ({job.percent_complete}% complete)")
        
        # Check reports
        reports = db.query(Report).all()
        print(f"[OK] Reports: {len(reports)}")
        for report in reports[:5]:  # Show first 5
            print(f"      - Report {report.id}: {report.report_type} ({report.title})")
        
        # Check system logs
        logs = db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(10).all()
        print(f"[OK] System Logs: {len(logs)} recent entries")
        for log in logs[:5]:  # Show first 5
            print(f"      - [{log.level}] {log.category}: {log.message[:50]}")
        
        db.close()
    except Exception as e:
        print(f"[ERROR] Error querying PostgreSQL: {e}")

def check_api_endpoints():
    """Check if API endpoints are working"""
    print("\n" + "=" * 60)
    print("5. Checking API Endpoints")
    print("=" * 60)
    
    endpoints = [
        ("/api/health", "Health check"),
        ("/api/robot-data/status", "Robot status"),
        ("/api/robot-data/servos/tonypi_raspberrypi", "Servo data"),
    ]
    
    for endpoint, description in endpoints:
        try:
            response = requests.get(f"{API_BASE}{endpoint}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"[OK] {description}: {len(data)} items")
                elif isinstance(data, dict):
                    if "servos" in data:
                        servo_count = len(data.get("servos", {}))
                        print(f"[OK] {description}: {servo_count} servos")
                    else:
                        print(f"[OK] {description}: Response received")
                else:
                    print(f"[OK] {description}: Response received")
            else:
                print(f"[WARNING] {description}: Status {response.status_code}")
        except Exception as e:
            print(f"[ERROR] {description}: {e}")

def check_docker_services():
    """Check if Docker services are running"""
    print("\n" + "=" * 60)
    print("6. Checking Docker Services")
    print("=" * 60)
    
    import subprocess
    try:
        result = subprocess.run(
            ["docker-compose", "ps"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            lines = result.stdout.split('\n')
            services = ["influxdb", "postgres", "backend"]
            for service in services:
                found = any(service in line for line in lines)
                if found:
                    status_line = [l for l in lines if service in l]
                    if status_line:
                        print(f"[OK] {service}: Running")
                else:
                    print(f"[WARNING] {service}: Not found in docker-compose ps")
        else:
            print(f"[WARNING] docker-compose ps failed: {result.stderr}")
    except Exception as e:
        print(f"[ERROR] Cannot check Docker services: {e}")

def main():
    print("\n" + "=" * 60)
    print("DATABASE CONNECTION DIAGNOSTIC")
    print("=" * 60)
    print(f"Time: {datetime.now().isoformat()}")
    print()
    
    # Check connections
    influx_ok = check_influxdb_connection()
    postgres_ok = check_postgres_connection()
    
    # Check data
    if influx_ok:
        check_influxdb_data()
    
    if postgres_ok:
        check_postgres_data()
    
    # Check API
    check_api_endpoints()
    
    # Check Docker
    check_docker_services()
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"InfluxDB: {'[OK] Connected' if influx_ok else '[ERROR] Not connected'}")
    print(f"PostgreSQL: {'[OK] Connected' if postgres_ok else '[ERROR] Not connected'}")
    print()
    
    if not influx_ok:
        print("Troubleshooting InfluxDB:")
        print("1. Check if InfluxDB container is running: docker-compose ps influxdb")
        print("2. Check InfluxDB logs: docker-compose logs influxdb")
        print("3. Verify .env file has correct INFLUXDB_URL, INFLUXDB_TOKEN, etc.")
        print()
    
    if not postgres_ok:
        print("Troubleshooting PostgreSQL:")
        print("1. Check if PostgreSQL container is running: docker-compose ps postgres")
        print("2. Check PostgreSQL logs: docker-compose logs postgres")
        print("3. Verify .env file has correct DATABASE_URL")
        print()

if __name__ == "__main__":
    main()











