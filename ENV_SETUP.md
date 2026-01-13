# Environment Variables Setup

## How to Configure Your Environment

Create a `.env` file in the project root with the following variables:

```env
# ============================================
# Database Configuration
# ============================================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=tonypi_db

# ============================================
# InfluxDB Configuration
# ============================================
INFLUXDB_TOKEN=my-super-secret-auth-token
INFLUXDB_ORG=tonypi
INFLUXDB_BUCKET=robot_data

# ============================================
# MQTT Broker Configuration
# ============================================
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883
MQTT_USERNAME=tonypi
MQTT_PASSWORD=tonypi123

# ============================================
# Grafana Configuration
# ============================================
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin
GRAFANA_BASE_URL=http://grafana:3000
GRAFANA_API_KEY=

# ============================================
# AI Analytics - Gemini API (FREE TIER)
# ============================================
# Get your FREE API key from: https://aistudio.google.com/app/apikey
# 
# Free tier limits (very generous):
# - 15 requests per minute
# - 1 million tokens per minute  
# - 1,500 requests per day
#
GEMINI_API_KEY=your-gemini-api-key-here
```

## Getting a Free Gemini API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key
5. Add it to your `.env` file as `GEMINI_API_KEY=your-key`

## Where to Put the .env File

The `.env` file should be in your project root:
```
Monitoring_System_TonyPi/
├── .env                    <-- Put it here
├── docker-compose.yml
├── backend/
├── frontend/
└── ...
```

## Docker Compose Usage

The `docker-compose.yml` already reads from `.env` automatically. After creating your `.env` file, rebuild:

```bash
docker-compose down
docker-compose up --build -d
```

## Verifying API Key is Loaded

Check the backend logs:
```bash
docker-compose logs backend | grep -i gemini
```

You should see: "Gemini AI: Initialized successfully"








