# Save this as: backend/generate_mqtt_docs.py
# Run: python generate_mqtt_docs.py

import os
import re
import json

def extract_mqtt_topics(mqtt_client_file="mqtt/mqttclient.py"):
    """Extract MQTT topic definitions from code"""
    
    topics = {
        'publish': [],
        'subscribe': []
    }
    
    if os.path.exists(mqtt_client_file):
        with open(mqtt_client_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Find publish calls
        pub_pattern = r'publish\s*\(\s*["\']([^"\']+)["\']'
        pub_topics = re.findall(pub_pattern, content)
        topics['publish'] = list(set(pub_topics))
        
        # Find subscribe calls
        sub_pattern = r'subscribe\s*\(\s*["\']([^"\']+)["\']'
        sub_topics = re.findall(sub_pattern, content)
        topics['subscribe'] = list(set(sub_topics))
    
    return topics

def extract_mqtt_message_structures(robot_client_file="../robot_client"):
    """Extract MQTT message JSON structures"""
    
    messages = []
    
    files_to_check = [
        robot_client_file,
        "mqtt/mqttclient.py",
        "services/robot_telemetry.py"
    ]
    
    for filepath in files_to_check:
        if os.path.isdir(filepath):
            for root, dirs, files in os.walk(filepath):
                for file in files:
                    if file.endswith('.py'):
                        full_path = os.path.join(root, file)
                        try:
                            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                                content = f.read()
                            
                            # Find JSON structures
                            json_pattern = r'json\.dumps\s*\(\s*\{([^}]+)\}'
                            json_matches = re.findall(json_pattern, content)
                            
                            for match in json_matches:
                                messages.append({
                                    'file': full_path,
                                    'structure': match[:100]
                                })
                        except:
                            pass
        elif os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Find JSON structures
            json_pattern = r'json\.dumps\s*\(\s*\{([^}]+)\}'
            json_matches = re.findall(json_pattern, content)
            
            for match in json_matches:
                messages.append({
                    'file': filepath,
                    'structure': match[:100]
                })
    
    return messages

def extract_qos_settings(config_files=["config.py", "../.env"]):
    """Extract MQTT QoS and other settings"""
    
    settings = {}
    
    for config_file in config_files:
        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Extract MQTT settings
            if 'MQTT' in content:
                # QoS level
                qos_match = re.search(r'(?:MQTT_QOS|QOS)\s*=\s*(\d+)', content)
                if qos_match:
                    settings['qos_level'] = int(qos_match.group(1))
                
                # Keep alive
                keepalive_match = re.search(r'(?:MQTT_KEEPALIVE|KEEPALIVE)\s*=\s*(\d+)', content)
                if keepalive_match:
                    settings['keepalive'] = int(keepalive_match.group(1))
                
                # Broker settings
                broker_match = re.search(r'MQTT_BROKER["\']?\s*=\s*["\']([^"\']+)["\']', content)
                if broker_match:
                    settings['broker'] = broker_match.group(1)
                
                port_match = re.search(r'MQTT_PORT\s*=\s*(\d+)', content)
                if port_match:
                    settings['port'] = int(port_match.group(1))
    
    return settings

# Generate documentation
if __name__ == "__main__":
    print("=" * 80)
    print("MQTT PROTOCOL DOCUMENTATION EXTRACTION")
    print("=" * 80)
    
    print("\n[1] MQTT TOPICS")
    print("-" * 80)
    topics = extract_mqtt_topics()
    
    print("\nPublish Topics:")
    for topic in topics['publish']:
        print(f"  - {topic}")
    
    print("\nSubscribe Topics:")
    for topic in topics['subscribe']:
        print(f"  - {topic}")
    
    print("\n[2] MQTT MESSAGE STRUCTURES")
    print("-" * 80)
    messages = extract_mqtt_message_structures()
    print(f"Message structures found: {len(messages)}")
    for i, msg in enumerate(messages[:5]):
        print(f"\n{i+1}. File: {msg['file']}")
        print(f"   Structure: {msg['structure']}...")
    
    print("\n[3] MQTT SETTINGS")
    print("-" * 80)
    settings = extract_qos_settings()
    for key, value in settings.items():
        print(f"  {key}: {value}")
    
    # Export to JSON
    export_data = {
        'topics': topics,
        'messages': messages,
        'settings': settings,
        'generated_at': str(__import__('datetime').datetime.now())
    }
    
    with open('mqtt_documentation.json', 'w') as f:
        json.dump(export_data, f, indent=2)
    
    print("\n[OK] Documentation exported to: mqtt_documentation.json")
