# Save this as: backend/generate_api_docs.py
# Run: python generate_api_docs.py

import os
import json
import re
from pathlib import Path
from typing import Dict, List

def extract_fastapi_endpoints(routers_dir="routers"):
    """Extract all FastAPI endpoints from router files"""
    
    endpoints = []
    
    for root, dirs, files in os.walk(routers_dir):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                # Find all @app.route, @router.get, @router.post, etc.
                patterns = [
                    r'@(app|router)\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']',
                    r'async def (\w+)\(',
                    r'def (\w+)\(',
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, content)
                    for match in matches:
                        endpoints.append({
                            'file': file,
                            'path': filepath,
                            'match': match
                        })
    
    return endpoints

def extract_models(models_dir="models"):
    """Extract all SQLAlchemy models"""
    
    models = []
    
    if not os.path.exists(models_dir):
        return models
    
    for file in os.listdir(models_dir):
        if file.endswith('.py') and not file.startswith('__'):
            filepath = os.path.join(models_dir, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            # Extract class definitions
            class_matches = re.findall(r'class (\w+)\(.*\):', content)
            
            # Extract fields
            field_matches = re.findall(r'(\w+)\s*=\s*Column\((.*?)\)', content)
            
            models.append({
                'file': file,
                'classes': class_matches,
                'fields': field_matches
            })
    
    return models

def extract_requirements():
    """Extract dependencies from requirements.txt"""
    
    requirements = []
    if os.path.exists('requirements.txt'):
        with open('requirements.txt', 'r', encoding='utf-8', errors='ignore') as f:
            requirements = f.read().strip().split('\n')
    
    return requirements

# Generate documentation
if __name__ == "__main__":
    print("=" * 80)
    print("BACKEND API DOCUMENTATION EXTRACTION")
    print("=" * 80)
    
    print("\n[1] FASTAPI ENDPOINTS")
    print("-" * 80)
    endpoints = extract_fastapi_endpoints()
    for ep in endpoints[:20]:  # Show first 20
        print(f"File: {ep['file']} | Match: {ep['match']}")
    
    print(f"\nTotal endpoints found: {len(endpoints)}")
    
    print("\n[2] DATABASE MODELS")
    print("-" * 80)
    models = extract_models()
    for model in models:
        print(f"\nFile: {model['file']}")
        print(f"  Classes: {model['classes']}")
        print(f"  Fields: {len(model['fields'])} total")
        for field in model['fields'][:5]:
            print(f"    - {field[0]}: {field[1]}")
    
    print("\n[3] DEPENDENCIES")
    print("-" * 80)
    requirements = extract_requirements()
    print(f"Total dependencies: {len(requirements)}")
    for req in requirements[:15]:
        print(f"  - {req}")
    
    # Export to JSON
    export_data = {
        'endpoints': endpoints,
        'models': models,
        'requirements': requirements,
        'generated_at': str(__import__('datetime').datetime.now())
    }
    
    with open('api_documentation.json', 'w') as f:
        json.dump(export_data, f, indent=2)
    
    print("\n[OK] Documentation exported to: api_documentation.json")
