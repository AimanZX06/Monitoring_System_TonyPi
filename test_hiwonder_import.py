#!/usr/bin/env python3
"""
Test script to find correct hiwonder SDK import method
Run this on your Raspberry Pi to diagnose import issues
"""

print("=" * 60)
print("Hiwonder SDK Import Test")
print("=" * 60)
print()

# Test 1: Check if hiwonder is installed
print("[1] Checking if hiwonder package is installed...")
try:
    import hiwonder
    print(f"   ✅ hiwonder package found")
    print(f"   📍 Location: {hiwonder.__file__}")
    print(f"   📦 Available attributes: {dir(hiwonder)}")
except ImportError as e:
    print(f"   ❌ hiwonder package not found: {e}")
    print("   💡 Install with: pip3 install hiwonder")
    print("   💡 Or: git clone https://github.com/Hiwonder-docs/hiwonder-sdk-python.git")
    exit(1)

print()

# Test 2: Try different import methods
print("[2] Testing different import methods...")
print()

import_methods = [
    ("from hiwonder import Board", "from hiwonder import Board"),
    ("import hiwonder; hiwonder.Board", "import hiwonder"),
    ("from hiwonder.board import Board", "from hiwonder.board import Board"),
    ("from hiwonder import ServoController", "from hiwonder import ServoController"),
    ("from hiwonder import RobotBoard", "from hiwonder import RobotBoard"),
    ("from hiwonder import TonyPiBoard", "from hiwonder import TonyPiBoard"),
]

successful_import = None

for name, code in import_methods:
    try:
        exec(code)
        print(f"   ✅ SUCCESS: {name}")
        successful_import = code
        break
    except Exception as e:
        print(f"   ❌ FAILED: {name}")
        print(f"      Error: {str(e)[:60]}...")

print()

# Test 3: Check submodules
print("[3] Checking for submodules...")
try:
    import hiwonder
    submodules = [attr for attr in dir(hiwonder) if not attr.startswith('_')]
    print(f"   Available: {submodules}")
    
    # Try importing submodules
    for submodule in ['board', 'servo', 'motor', 'robot']:
        try:
            exec(f"from hiwonder import {submodule}")
            print(f"   ✅ Found submodule: {submodule}")
        except:
            pass
except Exception as e:
    print(f"   Error: {e}")

print()

# Test 4: Check package structure
print("[4] Checking package structure...")
try:
    import hiwonder
    import os
    import inspect
    
    package_path = os.path.dirname(inspect.getfile(hiwonder))
    print(f"   📁 Package path: {package_path}")
    
    if os.path.exists(package_path):
        files = os.listdir(package_path)
        print(f"   📄 Files in package: {files[:10]}")  # Show first 10
        
        # Look for common files
        if '__init__.py' in files:
            print("   ✅ Package has __init__.py")
        
        # Check for board.py or similar
        board_files = [f for f in files if 'board' in f.lower()]
        if board_files:
            print(f"   📋 Found board-related files: {board_files}")
except Exception as e:
    print(f"   Error: {e}")

print()

# Test 5: Try to use SDK (if import worked)
if successful_import:
    print("[5] Testing SDK functionality...")
    try:
        if "Board" in successful_import:
            # Try to create Board instance
            try:
                board = Board()
                print("   ✅ Board() instantiation works")
            except Exception as e:
                print(f"   ⚠️  Board() instantiation failed: {e}")
                print("   💡 May need initialization parameters")
            
            # Try to call methods
            try:
                # These are common methods - adjust based on actual SDK
                methods_to_try = [
                    'getBusServoTemp',
                    'getBusServoPosition',
                    'getServoTemp',
                    'getServoPosition',
                ]
                
                for method in methods_to_try:
                    if hasattr(Board, method):
                        print(f"   ✅ Found method: {method}")
            except:
                pass
    except Exception as e:
        print(f"   Error testing functionality: {e}")

print()

# Summary
print("=" * 60)
print("SUMMARY")
print("=" * 60)

if successful_import:
    print(f"✅ Working import: {successful_import}")
    print()
    print("Next steps:")
    print("1. Use this import in your code")
    print("2. Check SDK documentation for usage")
    print("3. Test servo reading functionality")
else:
    print("❌ No working import found")
    print()
    print("Next steps:")
    print("1. Check SDK installation: pip3 list | grep hiwonder")
    print("2. Reinstall SDK if needed")
    print("3. Check SDK documentation")
    print("4. Consider using direct serial communication")
    print("5. Check robot's existing servo code for reference")

print()
print("=" * 60)













