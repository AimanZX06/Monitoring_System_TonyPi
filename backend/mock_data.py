"""
=============================================================================
Mock Data - QR Code Item Database for Testing
=============================================================================

This module provides a mock database of items for QR code scanning functionality.
It's used for testing and demonstration purposes when the robot scans QR codes.

USE CASE:
    1. Robot camera detects a QR code (e.g., "QR12345")
    2. Robot publishes scan to MQTT: tonypi/scan/{robot_id}
    3. Backend receives scan and looks up item in this mock database
    4. Item info is returned to robot for display/logging
    5. Job progress is updated if scanning is part of a task

ITEM STRUCTURE:
    Each item contains:
    - sku:         Stock Keeping Unit (internal product code)
    - name:        Human-readable item name
    - description: Detailed item description
    - weight_kg:   Item weight in kilograms
    - location:    Physical location in warehouse/facility
    - received_at: When the item was received

PRODUCTION NOTE:
    In a production system, this would be replaced with:
    - Database query (PostgreSQL)
    - Warehouse Management System (WMS) API
    - Inventory Management System integration

EXTENDING:
    To add more mock items, add entries to the mock_items dictionary:
    
    "QR_NEW_CODE": {
        "sku": "ITEM-XXX",
        "name": "New Item",
        "description": "Item description",
        "weight_kg": 0.5,
        "location": "Aisle X, Shelf Y",
        "received_at": datetime.utcnow().isoformat()
    }
"""

# =============================================================================
# IMPORTS
# =============================================================================

from datetime import datetime

mock_items = {
    "QR12345": {
        "sku": "ITEM-001",
        "name": "Widget A",
        "description": "Blue widget, 10cm x 5cm",
        "weight_kg": 0.55,
        "location": "Aisle 3, Shelf B",
        "received_at": datetime.utcnow().isoformat()
    },
    "QR67890": {
        "sku": "ITEM-002",
        "name": "Gadget B",
        "description": "Red gadget, fragile",
        "weight_kg": 1.2,
        "location": "Aisle 1, Shelf A",
        "received_at": datetime.utcnow().isoformat()
    },
    "QR00001": {
        "sku": "ITEM-003",
        "name": "Box C",
        "description": "Small cardboard box",
        "weight_kg": 0.2,
        "location": "Receiving",
        "received_at": datetime.utcnow().isoformat()
    }
}
