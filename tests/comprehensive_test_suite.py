#!/usr/bin/env python3
"""
Comprehensive System Testing Script for TonyPi Robot Monitoring System
This script performs functional, non-functional, and system tests.

Run with: python comprehensive_test_suite.py
"""

import sys
import os
import json
import time
import asyncio
import socket
import requests
import subprocess
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from enum import Enum

# Test Configuration
CONFIG = {
    "backend_url": "http://localhost:8000",
    "frontend_url": "http://localhost:3001",
    "influxdb_url": "http://localhost:8086",
    "grafana_url": "http://localhost:3000",
    "mqtt_broker": "localhost",
    "mqtt_port": 1883,
    "api_prefix": "/api/v1",
    "timeout": 10,
}


class TestStatus(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"
    WARN = "WARN"


@dataclass
class TestResult:
    name: str
    category: str
    status: TestStatus
    message: str = ""
    duration_ms: float = 0.0
    details: Dict = field(default_factory=dict)


@dataclass
class TestSuite:
    name: str
    results: List[TestResult] = field(default_factory=list)
    
    @property
    def passed(self) -> int:
        return sum(1 for r in self.results if r.status == TestStatus.PASS)
    
    @property
    def failed(self) -> int:
        return sum(1 for r in self.results if r.status == TestStatus.FAIL)
    
    @property
    def total(self) -> int:
        return len(self.results)
    
    @property
    def pass_rate(self) -> float:
        return (self.passed / self.total * 100) if self.total > 0 else 0


class SystemTester:
    """Comprehensive system tester for TonyPi Monitoring System."""
    
    def __init__(self):
        self.suites: List[TestSuite] = []
        self.start_time = datetime.now()
    
    def api_url(self, endpoint: str) -> str:
        """Build full API URL."""
        return f"{CONFIG['backend_url']}{CONFIG['api_prefix']}{endpoint}"
    
    def run_test(self, name: str, category: str, test_func) -> TestResult:
        """Run a single test and capture result."""
        start = time.time()
        try:
            status, message, details = test_func()
            duration = (time.time() - start) * 1000
            return TestResult(
                name=name,
                category=category,
                status=status,
                message=message,
                duration_ms=duration,
                details=details
            )
        except Exception as e:
            duration = (time.time() - start) * 1000
            return TestResult(
                name=name,
                category=category,
                status=TestStatus.FAIL,
                message=str(e),
                duration_ms=duration
            )
    
    # ===================== FUNCTIONAL TESTS =====================
    
    def test_health_endpoint(self) -> Tuple[TestStatus, str, Dict]:
        """Test backend health endpoint."""
        response = requests.get(self.api_url("/health"), timeout=CONFIG["timeout"])
        if response.status_code == 200:
            data = response.json()
            return TestStatus.PASS, "Health endpoint OK", data
        return TestStatus.FAIL, f"Status: {response.status_code}", {}
    
    def test_root_endpoint(self) -> Tuple[TestStatus, str, Dict]:
        """Test root API endpoint."""
        response = requests.get(f"{CONFIG['backend_url']}/", timeout=CONFIG["timeout"])
        if response.status_code == 200:
            return TestStatus.PASS, "Root endpoint OK", response.json()
        return TestStatus.FAIL, f"Status: {response.status_code}", {}
    
    def test_robot_status_endpoint(self) -> Tuple[TestStatus, str, Dict]:
        """Test robot status endpoint."""
        response = requests.get(self.api_url("/robot-data/status"), timeout=CONFIG["timeout"])
        if response.status_code == 200:
            data = response.json()
            robot_count = len(data) if isinstance(data, list) else 0
            return TestStatus.PASS, f"Found {robot_count} robot(s)", {"count": robot_count}
        return TestStatus.FAIL, f"Status: {response.status_code}", {}
    
    def test_alerts_endpoint(self) -> Tuple[TestStatus, str, Dict]:
        """Test alerts endpoint."""
        response = requests.get(self.api_url("/alerts"), timeout=CONFIG["timeout"])
        if response.status_code == 200:
            data = response.json()
            return TestStatus.PASS, f"Alerts retrieved", {"count": len(data)}
        return TestStatus.FAIL, f"Status: {response.status_code}", {}
    
    def test_reports_endpoint(self) -> Tuple[TestStatus, str, Dict]:
        """Test reports endpoint."""
        response = requests.get(self.api_url("/reports"), timeout=CONFIG["timeout"])
        if response.status_code == 200:
            return TestStatus.PASS, "Reports endpoint OK", {}
        return TestStatus.FAIL, f"Status: {response.status_code}", {}
    
    def test_logs_endpoint(self) -> Tuple[TestStatus, str, Dict]:
        """Test system logs endpoint."""
        response = requests.get(self.api_url("/logs"), timeout=CONFIG["timeout"])
        if response.status_code == 200:
            return TestStatus.PASS, "Logs endpoint OK", {}
        return TestStatus.FAIL, f"Status: {response.status_code}", {}
    
    def test_robots_db_endpoint(self) -> Tuple[TestStatus, str, Dict]:
        """Test robots database endpoint."""
        response = requests.get(self.api_url("/robots-db/robots"), timeout=CONFIG["timeout"])
        if response.status_code == 200:
            return TestStatus.PASS, "Robots DB endpoint OK", {}
        return TestStatus.FAIL, f"Status: {response.status_code}", {}
    
    def test_data_validation_endpoint(self) -> Tuple[TestStatus, str, Dict]:
        """Test data validation endpoint."""
        response = requests.get(self.api_url("/validate/expected-format"), timeout=CONFIG["timeout"])
        if response.status_code == 200:
            return TestStatus.PASS, "Validation endpoint OK", {}
        return TestStatus.FAIL, f"Status: {response.status_code}", {}
    
    def test_login_invalid_credentials(self) -> Tuple[TestStatus, str, Dict]:
        """Test login with invalid credentials returns 401."""
        response = requests.post(
            self.api_url("/auth/login"),
            json={"username": "invalid", "password": "invalid"},
            timeout=CONFIG["timeout"]
        )
        if response.status_code == 401:
            return TestStatus.PASS, "Invalid login rejected correctly", {}
        return TestStatus.FAIL, f"Expected 401, got {response.status_code}", {}
    
    def test_protected_route_unauthorized(self) -> Tuple[TestStatus, str, Dict]:
        """Test protected route without token returns 401."""
        response = requests.get(self.api_url("/auth/me"), timeout=CONFIG["timeout"])
        if response.status_code in [401, 403]:
            return TestStatus.PASS, "Protected route secured", {}
        return TestStatus.FAIL, f"Expected 401/403, got {response.status_code}", {}
    
    # ===================== INFRASTRUCTURE TESTS =====================
    
    def test_frontend_accessible(self) -> Tuple[TestStatus, str, Dict]:
        """Test frontend is accessible."""
        response = requests.get(CONFIG["frontend_url"], timeout=CONFIG["timeout"])
        if response.status_code == 200:
            return TestStatus.PASS, "Frontend accessible", {}
        return TestStatus.FAIL, f"Status: {response.status_code}", {}
    
    def test_influxdb_health(self) -> Tuple[TestStatus, str, Dict]:
        """Test InfluxDB is healthy."""
        response = requests.get(f"{CONFIG['influxdb_url']}/ping", timeout=CONFIG["timeout"])
        if response.status_code == 204:
            return TestStatus.PASS, "InfluxDB healthy", {}
        return TestStatus.FAIL, f"Status: {response.status_code}", {}
    
    def test_grafana_health(self) -> Tuple[TestStatus, str, Dict]:
        """Test Grafana is healthy."""
        response = requests.get(f"{CONFIG['grafana_url']}/api/health", timeout=CONFIG["timeout"])
        if response.status_code == 200:
            return TestStatus.PASS, "Grafana healthy", {}
        return TestStatus.FAIL, f"Status: {response.status_code}", {}
    
    def test_mqtt_broker_connection(self) -> Tuple[TestStatus, str, Dict]:
        """Test MQTT broker is accepting connections."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(CONFIG["timeout"])
            result = sock.connect_ex((CONFIG["mqtt_broker"], CONFIG["mqtt_port"]))
            sock.close()
            if result == 0:
                return TestStatus.PASS, "MQTT broker accepting connections", {}
            return TestStatus.FAIL, f"Connection refused (code: {result})", {}
        except socket.error as e:
            return TestStatus.FAIL, str(e), {}
    
    # ===================== PERFORMANCE TESTS =====================
    
    def test_api_response_time(self) -> Tuple[TestStatus, str, Dict]:
        """Test API response time is under threshold."""
        start = time.time()
        response = requests.get(self.api_url("/health"), timeout=CONFIG["timeout"])
        duration_ms = (time.time() - start) * 1000
        
        if duration_ms < 200:
            return TestStatus.PASS, f"Response time: {duration_ms:.1f}ms", {"duration_ms": duration_ms}
        elif duration_ms < 500:
            return TestStatus.WARN, f"Slow response: {duration_ms:.1f}ms", {"duration_ms": duration_ms}
        return TestStatus.FAIL, f"Too slow: {duration_ms:.1f}ms", {"duration_ms": duration_ms}
    
    def test_concurrent_requests(self) -> Tuple[TestStatus, str, Dict]:
        """Test handling of concurrent requests."""
        import concurrent.futures
        
        def make_request():
            return requests.get(self.api_url("/health"), timeout=CONFIG["timeout"])
        
        start = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        duration = (time.time() - start) * 1000
        success_count = sum(1 for r in results if r.status_code == 200)
        
        if success_count == 10:
            return TestStatus.PASS, f"10/10 requests succeeded in {duration:.1f}ms", {"success": success_count}
        return TestStatus.FAIL, f"Only {success_count}/10 succeeded", {"success": success_count}
    
    def test_database_query_performance(self) -> Tuple[TestStatus, str, Dict]:
        """Test database query performance."""
        start = time.time()
        response = requests.get(self.api_url("/robots-db/stats"), timeout=CONFIG["timeout"])
        duration_ms = (time.time() - start) * 1000
        
        if response.status_code == 200 and duration_ms < 500:
            return TestStatus.PASS, f"DB query: {duration_ms:.1f}ms", {"duration_ms": duration_ms}
        elif response.status_code == 200:
            return TestStatus.WARN, f"Slow DB query: {duration_ms:.1f}ms", {"duration_ms": duration_ms}
        return TestStatus.FAIL, f"Query failed: {response.status_code}", {}
    
    # ===================== SECURITY TESTS =====================
    
    def test_cors_headers(self) -> Tuple[TestStatus, str, Dict]:
        """Test CORS headers are present."""
        response = requests.options(
            self.api_url("/health"),
            headers={"Origin": "http://localhost:3001"},
            timeout=CONFIG["timeout"]
        )
        cors_header = response.headers.get("Access-Control-Allow-Origin")
        if cors_header:
            return TestStatus.PASS, f"CORS header present: {cors_header}", {}
        return TestStatus.WARN, "CORS header not found", {}
    
    def test_sql_injection_prevention(self) -> Tuple[TestStatus, str, Dict]:
        """Test SQL injection is prevented."""
        malicious_id = "1'; DROP TABLE users; --"
        response = requests.get(
            self.api_url(f"/robots-db/robots/{malicious_id}"),
            timeout=CONFIG["timeout"]
        )
        # Should return 404 (not found) not 500 (error)
        if response.status_code in [404, 422]:
            return TestStatus.PASS, "SQL injection prevented", {}
        elif response.status_code == 500:
            return TestStatus.FAIL, "Possible SQL injection vulnerability", {}
        return TestStatus.WARN, f"Unexpected status: {response.status_code}", {}
    
    def test_input_validation(self) -> Tuple[TestStatus, str, Dict]:
        """Test input validation on POST requests."""
        # Send invalid data to create alert
        response = requests.post(
            self.api_url("/alerts"),
            json={"invalid_field": "test"},
            timeout=CONFIG["timeout"]
        )
        if response.status_code == 422:
            return TestStatus.PASS, "Input validation working", {}
        return TestStatus.WARN, f"Status: {response.status_code}", {}
    
    # ===================== RUN ALL TESTS =====================
    
    def run_functional_tests(self) -> TestSuite:
        """Run all functional tests."""
        suite = TestSuite(name="Functional Tests")
        
        tests = [
            ("Health Endpoint", self.test_health_endpoint),
            ("Root Endpoint", self.test_root_endpoint),
            ("Robot Status Endpoint", self.test_robot_status_endpoint),
            ("Alerts Endpoint", self.test_alerts_endpoint),
            ("Reports Endpoint", self.test_reports_endpoint),
            ("Logs Endpoint", self.test_logs_endpoint),
            ("Robots DB Endpoint", self.test_robots_db_endpoint),
            ("Data Validation Endpoint", self.test_data_validation_endpoint),
            ("Invalid Login Rejection", self.test_login_invalid_credentials),
            ("Protected Route Security", self.test_protected_route_unauthorized),
        ]
        
        for name, test_func in tests:
            result = self.run_test(name, "Functional", test_func)
            suite.results.append(result)
        
        return suite
    
    def run_infrastructure_tests(self) -> TestSuite:
        """Run all infrastructure tests."""
        suite = TestSuite(name="Infrastructure Tests")
        
        tests = [
            ("Frontend Accessible", self.test_frontend_accessible),
            ("InfluxDB Health", self.test_influxdb_health),
            ("Grafana Health", self.test_grafana_health),
            ("MQTT Broker Connection", self.test_mqtt_broker_connection),
        ]
        
        for name, test_func in tests:
            result = self.run_test(name, "Infrastructure", test_func)
            suite.results.append(result)
        
        return suite
    
    def run_performance_tests(self) -> TestSuite:
        """Run all performance tests."""
        suite = TestSuite(name="Performance Tests")
        
        tests = [
            ("API Response Time", self.test_api_response_time),
            ("Concurrent Requests", self.test_concurrent_requests),
            ("Database Query Performance", self.test_database_query_performance),
        ]
        
        for name, test_func in tests:
            result = self.run_test(name, "Performance", test_func)
            suite.results.append(result)
        
        return suite
    
    def run_security_tests(self) -> TestSuite:
        """Run all security tests."""
        suite = TestSuite(name="Security Tests")
        
        tests = [
            ("CORS Headers", self.test_cors_headers),
            ("SQL Injection Prevention", self.test_sql_injection_prevention),
            ("Input Validation", self.test_input_validation),
        ]
        
        for name, test_func in tests:
            result = self.run_test(name, "Security", test_func)
            suite.results.append(result)
        
        return suite
    
    def run_all_tests(self) -> List[TestSuite]:
        """Run all test suites."""
        self.suites = [
            self.run_infrastructure_tests(),
            self.run_functional_tests(),
            self.run_performance_tests(),
            self.run_security_tests(),
        ]
        return self.suites
    
    def generate_report(self) -> Dict:
        """Generate test report."""
        total_passed = sum(s.passed for s in self.suites)
        total_failed = sum(s.failed for s in self.suites)
        total_tests = sum(s.total for s in self.suites)
        
        report = {
            "title": "TonyPi Monitoring System - Comprehensive Test Report",
            "generated_at": datetime.now().isoformat(),
            "duration_seconds": (datetime.now() - self.start_time).total_seconds(),
            "summary": {
                "total": total_tests,
                "passed": total_passed,
                "failed": total_failed,
                "pass_rate": f"{(total_passed/total_tests*100):.1f}%" if total_tests > 0 else "N/A",
            },
            "suites": []
        }
        
        for suite in self.suites:
            suite_data = {
                "name": suite.name,
                "total": suite.total,
                "passed": suite.passed,
                "failed": suite.failed,
                "pass_rate": f"{suite.pass_rate:.1f}%",
                "tests": [
                    {
                        "name": r.name,
                        "status": r.status.value,
                        "message": r.message,
                        "duration_ms": f"{r.duration_ms:.1f}",
                    }
                    for r in suite.results
                ]
            }
            report["suites"].append(suite_data)
        
        return report
    
    def print_results(self):
        """Print formatted test results."""
        print("\n" + "=" * 70)
        print("TonyPi Monitoring System - Comprehensive Test Report")
        print("=" * 70)
        print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        total_passed = 0
        total_failed = 0
        total_tests = 0
        
        for suite in self.suites:
            print(f"\n{'─' * 50}")
            print(f"📁 {suite.name}")
            print(f"{'─' * 50}")
            
            for result in suite.results:
                status_icon = {
                    TestStatus.PASS: "✅",
                    TestStatus.FAIL: "❌",
                    TestStatus.WARN: "⚠️",
                    TestStatus.SKIP: "⏭️",
                }.get(result.status, "❓")
                
                print(f"  {status_icon} {result.name}: {result.message} ({result.duration_ms:.1f}ms)")
            
            print(f"\n  Summary: {suite.passed}/{suite.total} passed ({suite.pass_rate:.1f}%)")
            total_passed += suite.passed
            total_failed += suite.failed
            total_tests += suite.total
        
        print("\n" + "=" * 70)
        print("OVERALL SUMMARY")
        print("=" * 70)
        overall_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {total_passed}")
        print(f"Failed: {total_failed}")
        print(f"Pass Rate: {overall_rate:.1f}%")
        print(f"Duration: {(datetime.now() - self.start_time).total_seconds():.2f}s")
        
        if total_failed == 0:
            print("\n🎉 ALL TESTS PASSED!")
        else:
            print(f"\n⚠️ {total_failed} test(s) failed.")
        
        print("=" * 70 + "\n")


def main():
    """Main entry point."""
    print("Starting comprehensive system tests...")
    
    tester = SystemTester()
    
    try:
        tester.run_all_tests()
        tester.print_results()
        
        # Save report to file
        report = tester.generate_report()
        report_file = f"test_reports/comprehensive_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        os.makedirs("test_reports", exist_ok=True)
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"Report saved to: {report_file}")
        
        # Exit with error code if any tests failed
        if report["summary"]["failed"] > 0:
            sys.exit(1)
        sys.exit(0)
        
    except Exception as e:
        print(f"\n❌ Test execution failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
