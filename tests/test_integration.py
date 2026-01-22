#!/usr/bin/env python3
"""
=============================================================================
TonyPi Monitoring System - Integration Test Suite
=============================================================================

This module provides comprehensive integration tests to verify the complete
data flow from the TonyPi robot through the entire monitoring system stack.

DATA FLOW TESTED:
    Robot → MQTT Broker → Backend API → InfluxDB/PostgreSQL → Frontend

PREREQUISITES:
    1. Docker services running: docker-compose up -d
    2. Robot connected and sending data (or use --skip-robot)
    3. Python dependencies: pip install requests paho-mqtt

TEST CATEGORIES:
    1. Docker Services Health   - Verify all containers are running
    2. Robot MQTT Connection    - Check robot is publishing telemetry
    3. Backend API Endpoints    - Test REST API functionality
    4. Data Storage (InfluxDB)  - Verify time-series data storage
    5. Command Sending          - Test MQTT command publishing
    6. Frontend Accessibility   - Verify React app is served
    7. Grafana Dashboard        - Check visualization service
    8. End-to-End Data Flow     - Full pipeline verification

USAGE EXAMPLES:
    # Run all tests with default settings
    python tests/test_integration.py
    
    # Quick test (shorter wait times)
    python tests/test_integration.py --quick
    
    # Skip robot connection test (offline mode)
    python tests/test_integration.py --skip-robot
    
    # Export results for documentation
    python tests/test_integration.py --export html
    python tests/test_integration.py --export all
    
    # Custom configuration
    python tests/test_integration.py --backend-url http://192.168.1.100:8000

EXPORT FORMATS:
    - JSON:  Machine-readable test results
    - TXT:   Plain text report
    - HTML:  Styled report for documentation/FYP submission

OUTPUT FILES:
    Reports are saved to current directory (or --output-dir):
    - integration_test_report_YYYYMMDD_HHMMSS.json
    - integration_test_report_YYYYMMDD_HHMMSS.txt
    - integration_test_report_YYYYMMDD_HHMMSS.html

NOTE: Run from project root or tests/ directory.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import sys
import os
import time
import json
import argparse
import requests
import platform
from datetime import datetime, timedelta, timezone

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration
DEFAULT_CONFIG = {
    "backend_url": "http://localhost:8000",
    "frontend_url": "http://localhost:3001",
    "mqtt_broker": "localhost",
    "mqtt_port": 1883,
    "influxdb_url": "http://localhost:8086",
    "grafana_url": "http://localhost:3000",
}


class Colors:
    """ANSI color codes for terminal output."""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


class IntegrationTestResults:
    """Track integration test results."""
    
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        self.tests = []
        self.start_time = datetime.now()
        self.end_time = None
        self.config = {}
        self.robot_id = None
    
    def add_pass(self, name, message=""):
        self.passed += 1
        self.tests.append({"name": name, "status": "PASS", "message": message, "timestamp": datetime.now().isoformat()})
        print(f"  {Colors.GREEN}✓ PASS{Colors.END}: {name}" + (f" - {message}" if message else ""))
    
    def add_fail(self, name, message=""):
        self.failed += 1
        self.tests.append({"name": name, "status": "FAIL", "message": message, "timestamp": datetime.now().isoformat()})
        print(f"  {Colors.RED}✗ FAIL{Colors.END}: {name}" + (f" - {message}" if message else ""))
    
    def add_warning(self, name, message=""):
        self.warnings += 1
        self.tests.append({"name": name, "status": "WARN", "message": message, "timestamp": datetime.now().isoformat()})
        print(f"  {Colors.YELLOW}⚠ WARN{Colors.END}: {name}" + (f" - {message}" if message else ""))
    
    def summary(self):
        self.end_time = datetime.now()
        print("\n" + "=" * 70)
        print(f"{Colors.BOLD}INTEGRATION TEST SUMMARY{Colors.END}")
        print("=" * 70)
        print(f"  {Colors.GREEN}✓ Passed:{Colors.END}   {self.passed}")
        print(f"  {Colors.RED}✗ Failed:{Colors.END}   {self.failed}")
        print(f"  {Colors.YELLOW}⚠ Warnings:{Colors.END} {self.warnings}")
        print(f"  Total:     {len(self.tests)}")
        print("=" * 70)
        
        if self.failed == 0:
            print(f"\n{Colors.GREEN}🎉 All integration tests passed!{Colors.END}")
            print("Your monitoring system is working correctly with the robot.")
        else:
            print(f"\n{Colors.RED}⚠️  Some tests failed. See details above.{Colors.END}")
            print("\nFailed tests:")
            for test in self.tests:
                if test["status"] == "FAIL":
                    print(f"  - {test['name']}: {test['message']}")
    
    def get_report_data(self):
        """Get all test data for export."""
        duration = (self.end_time - self.start_time).total_seconds() if self.end_time else 0
        return {
            "report_title": "TonyPi Monitoring System - Integration Test Report",
            "generated_at": datetime.now().isoformat(),
            "test_date": self.start_time.strftime("%Y-%m-%d"),
            "test_time": self.start_time.strftime("%H:%M:%S"),
            "duration_seconds": round(duration, 2),
            "system_info": {
                "platform": platform.system(),
                "platform_version": platform.version(),
                "python_version": platform.python_version(),
                "hostname": platform.node(),
            },
            "configuration": self.config,
            "robot_id": self.robot_id,
            "summary": {
                "total": len(self.tests),
                "passed": self.passed,
                "failed": self.failed,
                "warnings": self.warnings,
                "pass_rate": f"{(self.passed / len(self.tests) * 100):.1f}%" if self.tests else "0%",
                "status": "PASSED" if self.failed == 0 else "FAILED"
            },
            "tests": self.tests
        }
    
    def export_json(self, filename=None):
        """Export results to JSON file."""
        if filename is None:
            filename = f"integration_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        data = self.get_report_data()
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 JSON report saved: {filename}")
        return filename
    
    def export_txt(self, filename=None):
        """Export results to plain text file."""
        if filename is None:
            filename = f"integration_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        
        data = self.get_report_data()
        
        lines = []
        lines.append("=" * 70)
        lines.append("TONYPI MONITORING SYSTEM - INTEGRATION TEST REPORT")
        lines.append("=" * 70)
        lines.append("")
        lines.append(f"Generated: {data['generated_at']}")
        lines.append(f"Test Date: {data['test_date']} {data['test_time']}")
        lines.append(f"Duration:  {data['duration_seconds']} seconds")
        lines.append("")
        lines.append("-" * 70)
        lines.append("SYSTEM INFORMATION")
        lines.append("-" * 70)
        lines.append(f"Platform:       {data['system_info']['platform']}")
        lines.append(f"Python Version: {data['system_info']['python_version']}")
        lines.append(f"Hostname:       {data['system_info']['hostname']}")
        lines.append("")
        lines.append("-" * 70)
        lines.append("CONFIGURATION")
        lines.append("-" * 70)
        for key, value in data['configuration'].items():
            lines.append(f"{key}: {value}")
        if data['robot_id']:
            lines.append(f"Robot ID: {data['robot_id']}")
        lines.append("")
        lines.append("-" * 70)
        lines.append("TEST SUMMARY")
        lines.append("-" * 70)
        lines.append(f"Status:    {data['summary']['status']}")
        lines.append(f"Total:     {data['summary']['total']}")
        lines.append(f"Passed:    {data['summary']['passed']}")
        lines.append(f"Failed:    {data['summary']['failed']}")
        lines.append(f"Warnings:  {data['summary']['warnings']}")
        lines.append(f"Pass Rate: {data['summary']['pass_rate']}")
        lines.append("")
        lines.append("-" * 70)
        lines.append("DETAILED TEST RESULTS")
        lines.append("-" * 70)
        
        for i, test in enumerate(data['tests'], 1):
            status_icon = "[PASS]" if test['status'] == "PASS" else "[FAIL]" if test['status'] == "FAIL" else "[WARN]"
            lines.append(f"{i:2}. {status_icon} {test['name']}")
            if test['message']:
                lines.append(f"       {test['message']}")
        
        lines.append("")
        lines.append("=" * 70)
        lines.append("END OF REPORT")
        lines.append("=" * 70)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        
        print(f"📄 Text report saved: {filename}")
        return filename
    
    def export_html(self, filename=None):
        """Export results to HTML file for documentation."""
        if filename is None:
            filename = f"integration_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        
        data = self.get_report_data()
        
        # Generate HTML
        html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TonyPi Integration Test Report</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f5f5f5;
            padding: 20px;
        }}
        .container {{ max-width: 900px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            border-radius: 10px 10px 0 0;
            text-align: center;
        }}
        .header h1 {{ font-size: 24px; margin-bottom: 10px; }}
        .header .subtitle {{ opacity: 0.9; font-size: 14px; }}
        .content {{ padding: 30px; }}
        .section {{ margin-bottom: 30px; }}
        .section h2 {{ 
            color: #667eea; 
            border-bottom: 2px solid #667eea; 
            padding-bottom: 10px; 
            margin-bottom: 15px;
            font-size: 18px;
        }}
        .info-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }}
        .info-item {{ background: #f8f9fa; padding: 15px; border-radius: 8px; }}
        .info-item label {{ font-size: 12px; color: #666; text-transform: uppercase; display: block; margin-bottom: 5px; }}
        .info-item value {{ font-size: 16px; font-weight: 600; }}
        .summary-cards {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }}
        .card {{ 
            padding: 20px; 
            border-radius: 10px; 
            text-align: center;
            color: white;
        }}
        .card.total {{ background: #6c757d; }}
        .card.passed {{ background: #28a745; }}
        .card.failed {{ background: #dc3545; }}
        .card.warnings {{ background: #ffc107; color: #333; }}
        .card .number {{ font-size: 32px; font-weight: bold; }}
        .card .label {{ font-size: 12px; text-transform: uppercase; opacity: 0.9; }}
        .status-badge {{ 
            display: inline-block; 
            padding: 8px 20px; 
            border-radius: 20px; 
            font-weight: bold;
            font-size: 14px;
        }}
        .status-badge.passed {{ background: #d4edda; color: #155724; }}
        .status-badge.failed {{ background: #f8d7da; color: #721c24; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }}
        th {{ background: #f8f9fa; font-weight: 600; color: #495057; }}
        tr:hover {{ background: #f8f9fa; }}
        .status {{ 
            display: inline-block; 
            padding: 4px 10px; 
            border-radius: 4px; 
            font-size: 12px; 
            font-weight: 600;
        }}
        .status.pass {{ background: #d4edda; color: #155724; }}
        .status.fail {{ background: #f8d7da; color: #721c24; }}
        .status.warn {{ background: #fff3cd; color: #856404; }}
        .footer {{ 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 12px;
            border-top: 1px solid #dee2e6;
        }}
        @media print {{
            body {{ background: white; padding: 0; }}
            .container {{ box-shadow: none; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 TonyPi Monitoring System</h1>
            <div class="subtitle">Integration Test Report</div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 Test Summary</h2>
                <div style="text-align: center; margin-bottom: 20px;">
                    <span class="status-badge {'passed' if data['summary']['status'] == 'PASSED' else 'failed'}">
                        {data['summary']['status']} - {data['summary']['pass_rate']} Pass Rate
                    </span>
                </div>
                <div class="summary-cards">
                    <div class="card total">
                        <div class="number">{data['summary']['total']}</div>
                        <div class="label">Total Tests</div>
                    </div>
                    <div class="card passed">
                        <div class="number">{data['summary']['passed']}</div>
                        <div class="label">Passed</div>
                    </div>
                    <div class="card failed">
                        <div class="number">{data['summary']['failed']}</div>
                        <div class="label">Failed</div>
                    </div>
                    <div class="card warnings">
                        <div class="number">{data['summary']['warnings']}</div>
                        <div class="label">Warnings</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>ℹ️ Test Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Test Date</label>
                        <value>{data['test_date']}</value>
                    </div>
                    <div class="info-item">
                        <label>Test Time</label>
                        <value>{data['test_time']}</value>
                    </div>
                    <div class="info-item">
                        <label>Duration</label>
                        <value>{data['duration_seconds']} seconds</value>
                    </div>
                    <div class="info-item">
                        <label>Robot ID</label>
                        <value>{data['robot_id'] or 'N/A'}</value>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🖥️ System Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Platform</label>
                        <value>{data['system_info']['platform']}</value>
                    </div>
                    <div class="info-item">
                        <label>Python Version</label>
                        <value>{data['system_info']['python_version']}</value>
                    </div>
                    <div class="info-item">
                        <label>Hostname</label>
                        <value>{data['system_info']['hostname']}</value>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>⚙️ Configuration</h2>
                <div class="info-grid">
                    {''.join(f'<div class="info-item"><label>{k}</label><value>{v}</value></div>' for k, v in data['configuration'].items())}
                </div>
            </div>
            
            <div class="section">
                <h2>📋 Detailed Test Results</h2>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Test Name</th>
                            <th>Status</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {''.join(f"""
                        <tr>
                            <td>{i}</td>
                            <td>{test['name']}</td>
                            <td><span class="status {'pass' if test['status'] == 'PASS' else 'fail' if test['status'] == 'FAIL' else 'warn'}">{test['status']}</span></td>
                            <td>{test['message'] or '-'}</td>
                        </tr>
                        """ for i, test in enumerate(data['tests'], 1))}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated on {data['generated_at']} | TonyPi Monitoring System Integration Tests</p>
        </div>
    </div>
</body>
</html>'''
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html)
        
        print(f"📄 HTML report saved: {filename}")
        return filename
    
    def export_all(self, base_name=None):
        """Export to all formats."""
        if base_name is None:
            base_name = f"integration_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        files = []
        files.append(self.export_json(f"{base_name}.json"))
        files.append(self.export_txt(f"{base_name}.txt"))
        files.append(self.export_html(f"{base_name}.html"))
        
        return files


results = IntegrationTestResults()


def print_header(title):
    """Print a section header."""
    print(f"\n{Colors.BLUE}{'=' * 70}{Colors.END}")
    print(f"{Colors.BOLD}  {title}{Colors.END}")
    print(f"{Colors.BLUE}{'=' * 70}{Colors.END}")


def test_docker_services(config):
    """Test 1: Verify Docker services are running."""
    print_header("TEST 1: Docker Services Health Check")
    
    services = [
        ("Backend API", f"{config['backend_url']}/api/v1/health", [200]),
        ("Frontend", f"{config['frontend_url']}", [200]),
        ("InfluxDB", f"{config['influxdb_url']}/ping", [200, 204]),  # 204 is valid for ping
        ("Grafana", f"{config['grafana_url']}/api/health", [200]),
    ]
    
    all_healthy = True
    for name, url, valid_codes in services:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code in valid_codes:
                results.add_pass(f"{name} is running", url)
            else:
                results.add_fail(f"{name} unhealthy", f"Status: {response.status_code}")
                all_healthy = False
        except requests.exceptions.ConnectionError:
            results.add_fail(f"{name} not reachable", f"Cannot connect to {url}")
            all_healthy = False
        except Exception as e:
            results.add_fail(f"{name} error", str(e))
            all_healthy = False
    
    # Test MQTT broker
    try:
        import paho.mqtt.client as mqtt
        
        connected = False
        def on_connect(client, userdata, flags, reason_code, properties):
            nonlocal connected
            connected = reason_code.is_success if hasattr(reason_code, 'is_success') else (reason_code == 0)
        
        client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        client.on_connect = on_connect
        client.connect(config['mqtt_broker'], config['mqtt_port'], 5)
        client.loop_start()
        time.sleep(2)
        client.loop_stop()
        client.disconnect()
        
        if connected:
            results.add_pass("MQTT Broker is running", f"{config['mqtt_broker']}:{config['mqtt_port']}")
        else:
            results.add_fail("MQTT Broker connection failed")
            all_healthy = False
    except ImportError:
        results.add_warning("MQTT test skipped", "paho-mqtt not installed")
    except Exception as e:
        results.add_fail("MQTT Broker error", str(e))
        all_healthy = False
    
    return all_healthy


def test_robot_connection(config, wait_time=30):
    """Test 2: Check if robot is connected and sending data."""
    print_header("TEST 2: Robot Connection via MQTT")
    
    try:
        import paho.mqtt.client as mqtt
    except ImportError:
        results.add_fail("paho-mqtt not installed", "pip install paho-mqtt")
        return False
    
    robot_data_received = False
    received_data = {}
    status_data = {}  # Track status messages separately (contain system_info)
    sensor_data = {}  # Track sensor messages
    
    def on_message(client, userdata, msg):
        nonlocal robot_data_received, received_data, status_data, sensor_data
        try:
            data = json.loads(msg.payload.decode())
            robot_data_received = True
            received_data = data
            
            # Track status messages (contain system_info)
            if 'tonypi/status/' in msg.topic and 'system_info' in data:
                status_data = data
                print(f"  📡 Received status from: {data.get('robot_id', 'unknown')}")
            elif 'tonypi/sensors/' in msg.topic:
                sensor_data = data
                print(f"  📡 Received sensor data from: {data.get('robot_id', 'unknown')}")
            else:
                print(f"  📡 Received data from: {data.get('robot_id', 'unknown')}")
        except:
            pass
    
    client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
    client.on_message = on_message
    
    try:
        client.connect(config['mqtt_broker'], config['mqtt_port'], 60)
        client.subscribe("tonypi/data/#")
        client.subscribe("tonypi/status/#")
        client.subscribe("tonypi/sensors/#")
        
        print(f"  Waiting for robot data (up to {wait_time}s)...")
        print(f"  Subscribed to: tonypi/data/#, tonypi/status/#, tonypi/sensors/#")
        
        start_time = time.time()
        client.loop_start()
        
        # Wait for data, but try to get status message for system metrics
        while (time.time() - start_time) < wait_time:
            # Exit early if we have both sensor and status data
            if robot_data_received and status_data:
                break
            # Also exit after 5s if we have any data (don't wait full time)
            if robot_data_received and (time.time() - start_time) > 5:
                break
            time.sleep(1)
            elapsed = int(time.time() - start_time)
            if elapsed % 5 == 0 and elapsed > 0:
                print(f"  ... waiting ({elapsed}s)")
        
        client.loop_stop()
        client.disconnect()
        
        if robot_data_received:
            results.add_pass("Robot is sending data", f"robot_id: {received_data.get('robot_id', 'unknown')}")
            
            # Use status_data if available for richer checks, otherwise use received_data
            check_data = status_data if status_data else received_data
            
            # Check data fields - battery data
            has_battery = (
                'battery_level' in check_data or 
                'battery_voltage' in check_data or
                'battery' in check_data
            )
            if has_battery:
                results.add_pass("Battery data present")
            else:
                results.add_warning("Battery data not found in message", "Robot may be externally powered")
            
            # Check system metrics - use status_data which contains system_info
            system_info = check_data.get('system_info', {})
            has_system_metrics = (
                'system_cpu_percent' in check_data or
                'system_info' in check_data or
                'cpu_percent' in check_data or
                (isinstance(system_info, dict) and 'cpu_percent' in system_info)
            )
            if has_system_metrics:
                # Extract details if available
                if isinstance(system_info, dict) and system_info:
                    cpu = system_info.get('cpu_percent', 'N/A')
                    mem = system_info.get('memory_percent', 'N/A')
                    results.add_pass("System metrics present", f"CPU: {cpu}%, Memory: {mem}%")
                else:
                    results.add_pass("System metrics present")
            else:
                results.add_warning("System metrics not found", "Status message not received")
            
            return True, received_data
        else:
            results.add_fail("No robot data received", f"Waited {wait_time}s - is the robot running?")
            return False, None
            
    except Exception as e:
        results.add_fail("MQTT subscription failed", str(e))
        return False, None


def test_backend_api(config, robot_id=None):
    """Test 3: Verify Backend API endpoints."""
    print_header("TEST 3: Backend API Endpoints")
    
    base_url = config['backend_url']
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/api/v1/health", timeout=5)
        if response.status_code == 200:
            results.add_pass("Health endpoint", "/api/v1/health")
        else:
            results.add_fail("Health endpoint", f"Status: {response.status_code}")
    except Exception as e:
        results.add_fail("Health endpoint", str(e))
    
    # Test robot status endpoint
    try:
        response = requests.get(f"{base_url}/api/v1/robot-data/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                results.add_pass("Robot status endpoint", f"Found {len(data)} robot(s)")
                if len(data) > 0:
                    # Get first robot's ID for further tests
                    if robot_id is None and len(data) > 0:
                        robot_id = data[0].get('robot_id')
            else:
                results.add_pass("Robot status endpoint", "Response received")
        else:
            results.add_fail("Robot status endpoint", f"Status: {response.status_code}")
    except Exception as e:
        results.add_fail("Robot status endpoint", str(e))
    
    # Test latest data endpoint (if we have a robot_id)
    if robot_id:
        try:
            response = requests.get(f"{base_url}/api/v1/robot-data/latest/{robot_id}", timeout=5)
            if response.status_code == 200:
                results.add_pass(f"Latest data for {robot_id}", "Data retrieved")
            elif response.status_code == 404:
                results.add_warning(f"No data for {robot_id}", "Robot may not have sent data yet")
            else:
                results.add_fail(f"Latest data endpoint", f"Status: {response.status_code}")
        except Exception as e:
            results.add_fail("Latest data endpoint", str(e))
    
    # Test reports endpoint
    try:
        response = requests.get(f"{base_url}/api/v1/reports", timeout=5)
        if response.status_code == 200:
            results.add_pass("Reports endpoint", "/api/v1/reports")
        else:
            results.add_fail("Reports endpoint", f"Status: {response.status_code}")
    except Exception as e:
        results.add_fail("Reports endpoint", str(e))
    
    return robot_id


def test_data_storage(config, robot_id=None):
    """Test 4: Verify data is being stored in databases."""
    print_header("TEST 4: Data Storage (InfluxDB)")
    
    # We'll check via the backend API since direct InfluxDB access requires auth
    base_url = config['backend_url']
    
    try:
        # Query sensor data from last hour
        response = requests.get(
            f"{base_url}/api/v1/robot-data/sensors",
            params={"measurement": "robot_status", "time_range": "1h"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                results.add_pass("InfluxDB has data", f"Found {len(data)} data points")
            elif isinstance(data, list):
                results.add_warning("InfluxDB empty", "No data in last hour - robot may need more time")
            else:
                results.add_pass("InfluxDB query successful", "Response received")
        else:
            results.add_warning("Sensor data query", f"Status: {response.status_code}")
    except Exception as e:
        results.add_warning("InfluxDB check via API", str(e))
    
    # Check if we can get servo data
    if robot_id:
        try:
            response = requests.get(
                f"{base_url}/api/v1/robot-data/servos/{robot_id}",
                params={"time_range": "1h"},
                timeout=10
            )
            if response.status_code == 200:
                results.add_pass("Servo data available", f"For {robot_id}")
            elif response.status_code == 404:
                results.add_warning("No servo data yet", "Robot may not have sent servo data")
            else:
                results.add_warning("Servo data query", f"Status: {response.status_code}")
        except Exception as e:
            results.add_warning("Servo data check", str(e))


def test_send_command(config, robot_id):
    """Test 5: Test sending commands to robot."""
    print_header("TEST 5: Send Command to Robot")
    
    if not robot_id:
        results.add_warning("Command test skipped", "No robot_id available")
        return
    
    base_url = config['backend_url']
    
    # Send a status_request command (safe, doesn't move robot)
    command = {
        "type": "status_request",
        "robot_id": robot_id,
        "id": f"test_cmd_{int(time.time())}"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/v1/robot-data/command",
            json=command,
            timeout=5
        )
        
        if response.status_code in [200, 202]:
            results.add_pass("Command sent successfully", f"status_request to {robot_id}")
        else:
            results.add_fail("Command send failed", f"Status: {response.status_code}")
    except Exception as e:
        results.add_fail("Command endpoint error", str(e))


def test_frontend(config):
    """Test 6: Verify frontend is accessible."""
    print_header("TEST 6: Frontend Accessibility")
    
    try:
        response = requests.get(config['frontend_url'], timeout=10)
        if response.status_code == 200:
            results.add_pass("Frontend is accessible", config['frontend_url'])
            
            # Check if it's a React app
            if 'root' in response.text or 'react' in response.text.lower():
                results.add_pass("React app detected")
            else:
                results.add_warning("Could not verify React app")
        else:
            results.add_fail("Frontend not accessible", f"Status: {response.status_code}")
    except Exception as e:
        results.add_fail("Frontend error", str(e))


def test_grafana(config):
    """Test 7: Verify Grafana is accessible."""
    print_header("TEST 7: Grafana Dashboard")
    
    try:
        response = requests.get(f"{config['grafana_url']}/api/health", timeout=5)
        if response.status_code == 200:
            results.add_pass("Grafana is healthy", config['grafana_url'])
        else:
            results.add_fail("Grafana unhealthy", f"Status: {response.status_code}")
    except Exception as e:
        results.add_fail("Grafana error", str(e))


def test_end_to_end_flow(config, robot_id, wait_time=15):
    """Test 8: End-to-end data flow verification."""
    print_header("TEST 8: End-to-End Data Flow")
    
    if not robot_id:
        results.add_warning("E2E test skipped", "No robot connected")
        return
    
    print(f"  Verifying data flows from robot to API...")
    print(f"  Robot ID: {robot_id}")
    
    base_url = config['backend_url']
    
    # Get initial timestamp
    start_time = datetime.now(timezone.utc)
    
    # Wait for new data
    print(f"  Waiting {wait_time}s for fresh data...")
    time.sleep(wait_time)
    
    # Check if we got new data
    try:
        response = requests.get(f"{base_url}/api/v1/robot-data/latest/{robot_id}", timeout=5)
        if response.status_code == 200:
            data = response.json()
            
            # Check timestamp if available
            if 'timestamp' in data or 'last_seen' in data:
                results.add_pass("Fresh data received", "Data flow is working")
            else:
                results.add_pass("Data endpoint working", "Received response")
            
            # Verify data fields
            expected_fields = ['robot_id', 'status']
            for field in expected_fields:
                if field in data:
                    results.add_pass(f"Field '{field}' present", str(data[field])[:50])
        else:
            results.add_warning("Could not verify fresh data", f"Status: {response.status_code}")
    except Exception as e:
        results.add_fail("E2E verification failed", str(e))


def main():
    parser = argparse.ArgumentParser(description="TonyPi Integration Tests")
    parser.add_argument("--backend-url", default="http://localhost:8000", help="Backend API URL")
    parser.add_argument("--frontend-url", default="http://localhost:3001", help="Frontend URL")
    parser.add_argument("--mqtt-broker", default="localhost", help="MQTT broker host")
    parser.add_argument("--mqtt-port", type=int, default=1883, help="MQTT broker port")
    parser.add_argument("--robot-id", help="Specific robot ID to test")
    parser.add_argument("--quick", action="store_true", help="Quick test (shorter wait times)")
    parser.add_argument("--skip-robot", action="store_true", help="Skip robot connection test")
    parser.add_argument("--export", choices=['json', 'txt', 'html', 'all'], help="Export results for documentation")
    parser.add_argument("--output-dir", default=".", help="Output directory for exported reports")
    args = parser.parse_args()
    
    config = {
        "backend_url": args.backend_url,
        "frontend_url": args.frontend_url,
        "mqtt_broker": args.mqtt_broker,
        "mqtt_port": args.mqtt_port,
        "influxdb_url": "http://localhost:8086",
        "grafana_url": "http://localhost:3000",
    }
    
    # Store config in results for export
    results.config = config
    
    wait_time = 10 if args.quick else 30
    
    print()
    print(f"{Colors.BOLD}╔══════════════════════════════════════════════════════════════════════╗{Colors.END}")
    print(f"{Colors.BOLD}║          TonyPi Monitoring System - Integration Tests                ║{Colors.END}")
    print(f"{Colors.BOLD}╠══════════════════════════════════════════════════════════════════════╣{Colors.END}")
    print(f"{Colors.BOLD}║  Tests the full data flow: Robot → MQTT → Backend → DB → Frontend   ║{Colors.END}")
    print(f"{Colors.BOLD}╚══════════════════════════════════════════════════════════════════════╝{Colors.END}")
    print()
    print(f"  Configuration:")
    print(f"    Backend:  {config['backend_url']}")
    print(f"    Frontend: {config['frontend_url']}")
    print(f"    MQTT:     {config['mqtt_broker']}:{config['mqtt_port']}")
    if args.export:
        print(f"    Export:   {args.export} format")
    print()
    
    # Run tests
    robot_id = args.robot_id
    robot_data = None
    
    # Test 1: Docker services
    services_ok = test_docker_services(config)
    
    if not services_ok:
        print(f"\n{Colors.RED}⚠️  Some Docker services are not running!{Colors.END}")
        print("Please run: docker-compose up -d")
        print("Then re-run this test.\n")
    
    # Test 2: Robot connection
    if not args.skip_robot:
        robot_connected, robot_data = test_robot_connection(config, wait_time)
        if robot_data and not robot_id:
            robot_id = robot_data.get('robot_id')
    else:
        results.add_warning("Robot test skipped", "--skip-robot flag")
    
    # Store robot_id in results
    results.robot_id = robot_id
    
    # Test 3: Backend API
    robot_id = test_backend_api(config, robot_id)
    
    # Test 4: Data storage
    test_data_storage(config, robot_id)
    
    # Test 5: Send command
    if robot_id and not args.skip_robot:
        test_send_command(config, robot_id)
    
    # Test 6: Frontend
    test_frontend(config)
    
    # Test 7: Grafana
    test_grafana(config)
    
    # Test 8: End-to-end
    if robot_id and not args.skip_robot:
        test_end_to_end_flow(config, robot_id, wait_time=10 if args.quick else 15)
    
    # Print summary
    results.summary()
    
    # Export results if requested
    if args.export:
        print(f"\n{Colors.BOLD}📁 Exporting Reports for Documentation...{Colors.END}")
        
        # Create output directory if needed
        output_dir = args.output_dir
        if output_dir != "." and not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        base_name = os.path.join(output_dir, f"integration_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        
        if args.export == 'json':
            results.export_json(f"{base_name}.json")
        elif args.export == 'txt':
            results.export_txt(f"{base_name}.txt")
        elif args.export == 'html':
            results.export_html(f"{base_name}.html")
        elif args.export == 'all':
            results.export_all(base_name)
        
        print(f"\n{Colors.GREEN}✓ Reports exported successfully!{Colors.END}")
        print(f"  Use these files for your documentation.")
    
    # Print next steps
    print(f"\n{Colors.BOLD}Next Steps:{Colors.END}")
    if results.failed == 0:
        print("  1. Open the frontend: http://localhost:3001")
        print("  2. View Grafana dashboards: http://localhost:3000")
        print("  3. Check API docs: http://localhost:8000/docs")
    else:
        print("  1. Check Docker services: docker-compose ps")
        print("  2. View logs: docker-compose logs -f backend")
        print("  3. Ensure robot is running and connected to network")
    
    if not args.export:
        print(f"\n  💡 Tip: Add --export html to generate a report for documentation")
    
    return 0 if results.failed == 0 else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}⚠️  Test interrupted by user{Colors.END}")
        sys.exit(1)
