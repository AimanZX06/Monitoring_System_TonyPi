from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import os
from dotenv import load_dotenv

load_dotenv()

class InfluxClient:
    def __init__(self):
        self.url = os.getenv("INFLUXDB_URL", "http://localhost:8086")
        self.token = os.getenv("INFLUXDB_TOKEN", "my-super-secret-auth-token")
        self.org = os.getenv("INFLUXDB_ORG", "tonypi")
        self.bucket = os.getenv("INFLUXDB_BUCKET", "robot_data")
        
        self.client = InfluxDBClient(url=self.url, token=self.token, org=self.org)
        self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
        self.query_api = self.client.query_api()

    def write_sensor_data(self, measurement: str, tags: dict, fields: dict):
        """Write sensor data to InfluxDB"""
        point = Point(measurement)
        
        # Add tags
        for key, value in tags.items():
            point = point.tag(key, value)
        
        # Add fields
        for key, value in fields.items():
            point = point.field(key, value)
        
        try:
            self.write_api.write(bucket=self.bucket, record=point)
            return True
        except Exception as e:
            print(f"Error writing to InfluxDB: {e}")
            return False

    def query_recent_data(self, measurement: str, time_range: str = "1h"):
        """Query recent data from InfluxDB"""
        query = f'''
        from(bucket: "{self.bucket}")
          |> range(start: -{time_range})
          |> filter(fn: (r) => r._measurement == "{measurement}")
        '''
        
        try:
            result = self.query_api.query(query, org=self.org)
            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        "time": record.get_time(),
                        "measurement": record.get_measurement(),
                        "field": record.get_field(),
                        "value": record.get_value(),
                        **{k: v for k, v in record.values.items() if k.startswith('_') is False and k not in ['result', 'table']}
                    })
            return data
        except Exception as e:
            error_msg = f"Error querying from InfluxDB: {e}"
            print(error_msg)
            import traceback
            traceback.print_exc()
            # Re-raise the exception so the API can return proper error
            raise Exception(f"InfluxDB query failed: {str(e)}")

    def close(self):
        """Close the InfluxDB client"""
        if self.client:
            self.client.close()

# Global InfluxDB client instance
influx_client = InfluxClient()