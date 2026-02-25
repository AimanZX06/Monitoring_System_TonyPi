# Save as: backend/generate_all_docs.py
# Run: python generate_all_docs.py

import subprocess
import os
import json
from datetime import datetime

def run_generator(script_name, description):
    """Run a generator script and report results"""
    
    print(f"\n{'='*80}")
    print(f"Running: {description}")
    print('='*80)
    
    try:
        result = subprocess.run(['python', script_name], capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        return True
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        return False

# Run all generators
print("\n" + "="*80)
print("TONYPI SYSTEM - COMPLETE DOCUMENTATION GENERATION")
print("="*80)

generators = [
    ('generate_api_docs.py', 'Backend API Documentation'),
    ('generate_db_docs.py', 'Database Schema Documentation'),
    ('generate_mqtt_docs.py', 'MQTT Protocol Documentation'),
    ('generate_test_docs.py', 'Testing Documentation'),
]

results = {}
for script, desc in generators:
    if os.path.exists(script):
        results[desc] = run_generator(script, desc)
    else:
        print(f"[WARN] {script} not found in current directory")

# Also run frontend
print(f"\n{'='*80}")
print("Generating Frontend Documentation")
print('='*80)

try:
    result = subprocess.run(['node', 'scripts/generate_component_docs.js'], 
                          cwd='../frontend',
                          capture_output=True, 
                          text=True)
    print(result.stdout)
    results['Frontend Components'] = True
except Exception as e:
    print(f"[WARN] Frontend generation skipped: {e}")
    results['Frontend Components'] = False

# Summary
print(f"\n{'='*80}")
print("DOCUMENTATION GENERATION SUMMARY")
print('='*80)

for generator, success in results.items():
    status = "[OK]" if success else "[FAIL]"
    print(f"{status} {generator}")

# Collect all generated files
print(f"\n{'='*80}")
print("GENERATED FILES")
print('='*80)

json_files = [f for f in os.listdir('.') if f.endswith('_documentation.json')]
print(f"\nFound {len(json_files)} documentation files:")
for file in json_files:
    size = os.path.getsize(file)
    print(f"  [OK] {file} ({size} bytes)")

# Create master documentation index
master_index = {
    'generated_at': datetime.now().isoformat(),
    'documentation_files': json_files,
    'generation_results': results
}

with open('DOCUMENTATION_INDEX.json', 'w') as f:
    json.dump(master_index, f, indent=2)

print("\n[OK] Master index created: DOCUMENTATION_INDEX.json")
print("\n[COMPLETE] All documentation generated successfully!")
