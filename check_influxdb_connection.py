#!/usr/bin/env python3
"""
Check InfluxDB connection and diagnose issues
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

try:
    from influxdb_client import InfluxDBClient
    from influxdb_client.client.write_api import SYNCHRONOUS
except ImportError:
    print("ERROR: influxdb_client not installed")
    print("Install with: pip install influxdb-client")
    sys.exit(1)

# Get configuration
url = os.getenv("INFLUXDB_URL", "http://localhost:8086")
token = os.getenv("INFLUXDB_TOKEN", "my-super-secret-auth-token")
org = os.getenv("INFLUXDB_ORG", "tonypi")
bucket = os.getenv("INFLUXDB_BUCKET", "robot_data")

print("=" * 60)
print("InfluxDB Connection Diagnostic")
print("=" * 60)
print(f"URL: {url}")
print(f"Org: {org}")
print(f"Bucket: {bucket}")
print(f"Token: {token[:20]}..." if len(token) > 20 else f"Token: {token}")
print()

# Test connection
try:
    print("1. Testing connection...")
    client = InfluxDBClient(url=url, token=token, org=org)
    print("   ✓ Client created successfully")
    
    print("\n2. Testing query API...")
    query_api = client.query_api()
    print("   ✓ Query API created successfully")
    
    print("\n3. Testing write API...")
    write_api = client.write_api(write_options=SYNCHRONOUS)
    print("   ✓ Write API created successfully")
    
    print("\n4. Testing query (checking if bucket exists)...")
    query = f'''
    from(bucket: "{bucket}")
      |> range(start: -1h)
      |> limit(n: 1)
    '''
    try:
        result = query_api.query(query, org=org)
        print(f"   ✓ Query executed successfully")
        print(f"   ✓ Bucket '{bucket}' exists and is accessible")
        
        # Count records
        count = 0
        for table in result:
            for record in table.records:
                count += 1
        print(f"   ✓ Found {count} record(s) in last hour")
    except Exception as e:
        print(f"   ✗ Query failed: {e}")
        print(f"   This might be normal if the bucket is empty")
    
    print("\n5. Testing write (test point)...")
    from influxdb_client import Point
    test_point = Point("connection_test").field("test", 1)
    try:
        write_api.write(bucket=bucket, record=test_point)
        print("   ✓ Write test successful")
    except Exception as e:
        print(f"   ✗ Write test failed: {e}")
    
    print("\n6. Checking measurements...")
    query = f'''
    from(bucket: "{bucket}")
      |> range(start: -24h)
      |> group()
      |> distinct(column: "_measurement")
    '''
    try:
        result = query_api.query(query, org=org)
        measurements = []
        for table in result:
            for record in table.records:
                measurements.append(record.get_value())
        if measurements:
            print(f"   ✓ Found measurements: {', '.join(measurements)}")
        else:
            print("   ⚠ No measurements found (database is empty)")
    except Exception as e:
        print(f"   ✗ Failed to list measurements: {e}")
    
    client.close()
    print("\n" + "=" * 60)
    print("Diagnostic complete!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n✗ Connection failed: {e}")
    import traceback
    traceback.print_exc()
    print("\nTroubleshooting:")
    print("1. Check if InfluxDB is running: docker-compose ps")
    print("2. Check InfluxDB logs: docker-compose logs influxdb")
    print("3. Verify token in .env file matches InfluxDB setup")
    print("4. Verify URL is correct (should be http://influxdb:8086 from backend)")
    sys.exit(1)




