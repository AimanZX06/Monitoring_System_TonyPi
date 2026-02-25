# Save this as: backend/generate_db_docs.py
# Run: python generate_db_docs.py

import os
import re
import json
from pathlib import Path

def extract_sqlalchemy_models(models_dir="models"):
    """Extract SQLAlchemy model definitions"""
    
    models_doc = []
    
    if not os.path.exists(models_dir):
        return models_doc
    
    for file in os.listdir(models_dir):
        if file.endswith('.py') and not file.startswith('__'):
            filepath = os.path.join(models_dir, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Extract class definitions
            class_pattern = r'class\s+(\w+)\(.*?Base.*?\):'
            class_matches = re.finditer(class_pattern, content)
            
            for match in class_matches:
                class_name = match.group(1)
                
                # Extract table name
                tablename_match = re.search(
                    rf'class\s+{class_name}.*?__tablename__\s*=\s*["\']([^"\']+)["\']',
                    content,
                    re.DOTALL
                )
                tablename = tablename_match.group(1) if tablename_match else class_name
                
                # Extract columns
                column_pattern = r'(\w+)\s*=\s*Column\((.*?)\)'
                columns = re.findall(column_pattern, content)
                
                models_doc.append({
                    'class': class_name,
                    'table': tablename,
                    'file': file,
                    'columns': [
                        {
                            'name': col[0],
                            'type': col[1].split(',')[0].strip()
                        }
                        for col in columns
                    ]
                })
    
    return models_doc

def extract_influxdb_schema(config_file="config.py"):
    """Extract InfluxDB schema from config"""
    
    schema = {
        'measurements': [],
        'tags': [],
        'fields': []
    }
    
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Look for InfluxDB configuration
        if 'INFLUX' in content or 'influx' in content:
            schema['found'] = True
            # Extract measurement definitions
            measurement_pattern = r'(?:measurement|MEASUREMENT).*?["\']([^"\']+)["\']'
            measurements = re.findall(measurement_pattern, content)
            schema['measurements'] = list(set(measurements))
    
    return schema

def extract_migrations(migrations_dir="alembic/versions"):
    """Extract database migrations"""
    
    migrations = []
    
    if os.path.exists(migrations_dir):
        for file in sorted(os.listdir(migrations_dir))[-10:]:  # Last 10 migrations
            if file.endswith('.py'):
                filepath = os.path.join(migrations_dir, file)
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Extract revision message
                message_match = re.search(r'"""(.*?)"""', content, re.DOTALL)
                
                migrations.append({
                    'file': file,
                    'description': message_match.group(1).strip() if message_match else 'No description',
                    'size': len(content)
                })
    
    return migrations

# Generate documentation
if __name__ == "__main__":
    print("=" * 80)
    print("DATABASE SCHEMA DOCUMENTATION EXTRACTION")
    print("=" * 80)
    
    print("\n[1] SQLALCHEMY MODELS")
    print("-" * 80)
    models = extract_sqlalchemy_models()
    for model in models:
        print(f"\nTable: {model['table']} (Class: {model['class']})")
        print(f"  File: {model['file']}")
        print(f"  Columns: {len(model['columns'])}")
        for col in model['columns'][:5]:
            print(f"    - {col['name']}: {col['type']}")
        if len(model['columns']) > 5:
            print(f"    ... and {len(model['columns']) - 5} more columns")
    
    print(f"\n\nTotal models: {len(models)}")
    
    print("\n[2] INFLUXDB SCHEMA")
    print("-" * 80)
    influx = extract_influxdb_schema()
    print(f"Measurements found: {len(influx['measurements'])}")
    for measurement in influx['measurements']:
        print(f"  - {measurement}")
    
    print("\n[3] DATABASE MIGRATIONS")
    print("-" * 80)
    migrations = extract_migrations()
    print(f"Total migrations: {len(migrations)}")
    for mig in migrations[-5:]:
        print(f"\nFile: {mig['file']}")
        print(f"  Description: {mig['description'][:70]}...")
    
    # Export to JSON
    export_data = {
        'models': models,
        'influxdb_schema': influx,
        'migrations': migrations,
        'generated_at': str(__import__('datetime').datetime.now())
    }
    
    with open('database_documentation.json', 'w') as f:
        json.dump(export_data, f, indent=2)
    
    print("\n[OK] Documentation exported to: database_documentation.json")
