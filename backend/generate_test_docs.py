# Save this as: backend/generate_test_docs.py
# Run: python generate_test_docs.py

import os
import re
import json

def extract_unit_tests(test_dir="tests"):
    """Extract unit test information"""
    
    tests = []
    
    for root, dirs, files in os.walk(test_dir):
        for file in files:
            if file.startswith('test_') and file.endswith('.py'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Extract test functions
                test_functions = re.findall(r'def (test_\w+)\(', content)
                
                # Extract test classes
                test_classes = re.findall(r'class (Test\w+)\(', content)
                
                tests.append({
                    'file': file,
                    'path': filepath,
                    'test_functions': test_functions,
                    'test_classes': test_classes,
                    'total_tests': len(test_functions) + len(test_classes)
                })
    
    return tests

def extract_test_coverage():
    """Extract test coverage if available"""
    
    coverage = {}
    
    coverage_file = ".coverage"
    coverage_xml = "coverage.xml"
    
    if os.path.exists(coverage_file):
        coverage['type'] = '.coverage'
    
    if os.path.exists(coverage_xml):
        with open(coverage_xml, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Extract coverage percentage
        line_rate = re.search(r'line-rate="([\d.]+)"', content)
        if line_rate:
            coverage['line_rate'] = float(line_rate.group(1)) * 100
    
    return coverage

def extract_pytest_config():
    """Extract pytest configuration"""
    
    config = {}
    
    if os.path.exists('pytest.ini'):
        with open('pytest.ini', 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Extract configuration
        markers = re.findall(r'markers\s*=\s*(.+)', content)
        testpaths = re.findall(r'testpaths\s*=\s*(.+)', content)
        
        config['markers'] = markers
        config['testpaths'] = testpaths
    
    return config

# Generate documentation
if __name__ == "__main__":
    print("=" * 80)
    print("TESTING DOCUMENTATION EXTRACTION")
    print("=" * 80)
    
    print("\n[1] UNIT TESTS")
    print("-" * 80)
    tests = extract_unit_tests()
    total_tests = 0
    
    for test_file in tests:
        print(f"\nFile: {test_file['file']}")
        print(f"  Test functions: {len(test_file['test_functions'])}")
        print(f"  Test classes: {len(test_file['test_classes'])}")
        print(f"  Total: {test_file['total_tests']}")
        
        for test_func in test_file['test_functions'][:3]:
            print(f"    - {test_func}")
        
        total_tests += test_file['total_tests']
    
    print(f"\n\nTotal test cases: {total_tests}")
    
    print("\n[2] TEST COVERAGE")
    print("-" * 80)
    coverage = extract_test_coverage()
    if coverage:
        for key, value in coverage.items():
            print(f"  {key}: {value}")
    else:
        print("  No coverage data found. Run pytest with --cov to generate coverage.")
    
    print("\n[3] PYTEST CONFIGURATION")
    print("-" * 80)
    pytest_config = extract_pytest_config()
    for key, value in pytest_config.items():
        print(f"  {key}: {value}")
    
    # Export to JSON
    export_data = {
        'tests': tests,
        'coverage': coverage,
        'configuration': pytest_config,
        'generated_at': str(__import__('datetime').datetime.now())
    }
    
    with open('testing_documentation.json', 'w') as f:
        json.dump(export_data, f, indent=2)
    
    print("\n[OK] Documentation exported to: testing_documentation.json")
