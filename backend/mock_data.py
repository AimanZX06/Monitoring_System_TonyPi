"""Mock item database for QR scan lookup.

This module contains a small mapping of QR codes to mock item information.
When a robot scans a QR code it will publish the code to the backend via MQTT and
the backend will lookup the item here and return the item info to the robot.
"""
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
