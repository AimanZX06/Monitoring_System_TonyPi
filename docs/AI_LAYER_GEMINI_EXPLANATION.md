# AI Layer Implementation - Gemini API Integration

## Overview

The TonyPi Robot Monitoring System integrates **Google Gemini API** (free tier) to provide AI-powered analytics for intelligent report generation. This document explains the implementation details and provides screenshot guides for thesis documentation.

---

## Architecture Flow

```
┌───────────────────────────────────────────────────────────────────────┐
│                   AI-Powered Report Generation Flow                    │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [1] User Request        [2] Data Collection      [3] AI Analysis     │
│  ┌────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│  │  POST /reports │     │   Query Data    │     │  Gemini API     │  │
│  │  /generate     │────▶│ • InfluxDB      │────▶│  (gemini-2.0-   │  │
│  │  ?type=...     │     │ • PostgreSQL    │     │   flash)        │  │
│  └────────────────┘     └─────────────────┘     └────────┬────────┘  │
│                                                          │            │
│  [6] PDF Download        [5] Store Report        [4] AI Response     │
│  ┌────────────────┐     ┌─────────────────┐     ┌────────▼────────┐  │
│  │ GET /reports/  │◀────│   PostgreSQL    │◀────│  JSON Response  │  │
│  │ {id}/pdf       │     │   + AI Analysis │     │  • analysis     │  │
│  └────────────────┘     └─────────────────┘     │  • concerns     │  │
│                                                  │  • recommend.   │  │
│                                                  └─────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 📸 Screenshot Guide

### GeminiAnalytics Service (`backend/services/gemini_analytics.py`)

| # | Screenshot Description | Lines | What to Capture |
|---|------------------------|-------|-----------------|
| 1 | **Module Docstring** - Purpose, analysis types, usage | 1-64 | Complete docstring showing AI capabilities |
| 2 | **Imports & SDK Import** - Python imports and graceful fallback | 66-91 | Import handling with try/except |
| 3 | **Class Init & Model Selection** - API key loading, model fallback | 99-156 | `__init__()` with 4-model cascade |
| 4 | **Performance Analysis** - CPU/memory/temp analysis prompt | 161-231 | `analyze_performance_data()` complete |
| 5 | **Job Analysis** - Efficiency assessment prompt | 233-312 | `analyze_job_data()` complete |
| 6 | **Servo Analysis** - Maintenance recommendations | 314-408 | `analyze_servo_data()` complete |
| 7 | **Executive Summary** - Natural language generation | 410-445 | `generate_summary()` method |
| 8 | **Global Instance** - Singleton pattern | 448-449 | Global `gemini_analytics` instance |

### Reports Router Integration (`backend/routers/reports.py`)

| # | Screenshot Description | Lines | What to Capture |
|---|------------------------|-------|-----------------|
| 9 | **AI Integration Docstring** | 39-55 | Documentation explaining AI integration |
| 10 | **Gemini Import** - Optional dependency with fallback | 82-89 | Try/except import pattern |
| 11 | **Performance AI Call** - Invoking Gemini for analysis | 471-486 | AI analysis in `generate_and_store_report()` |
| 12 | **Job AI Call** - Efficiency analysis | 516-532 | Job report AI integration |
| 13 | **Servo AI Call** - Maintenance analysis | 599-607 | Maintenance report AI integration |
| 14 | **AI Status Endpoint** | 637-644 | `get_ai_status()` endpoint |
| 15 | **PDF with AI** - Embedding AI in PDF reports | 766-784 | AI analysis in PDF generation |

---

## Key Implementation Details

### 1. Model Selection Strategy (Lines 116-135)

The service uses a **4-model fallback cascade** for reliability:

```python
model_names = [
    'gemini-2.0-flash',   # Latest, fastest (FREE tier)
    'gemini-1.5-flash',   # Previous version
    'gemini-1.5-pro',     # More capable
    'gemini-pro',         # Legacy fallback
]

# Try each model until one works
for model_name in model_names:
    try:
        test_model = genai.GenerativeModel(model_name)
        test_response = test_model.generate_content("Say 'ok'")
        if test_response:
            self.model = test_model
            break
    except Exception:
        continue
```

**Why this matters:** Google periodically deprecates older models. This cascade ensures the system automatically adapts to model availability changes.

---

### 2. Analysis Types (3 Categories)

| Type | Method | Input Data | AI Output |
|------|--------|------------|-----------|
| **Performance** | `analyze_performance_data()` | CPU, memory, temp, data points | Health analysis, concerns, recommendations |
| **Job** | `analyze_job_data()` | Start/end time, items processed, % complete | Efficiency rating, throughput recommendations |
| **Maintenance** | `analyze_servo_data()` | 6 servo temps, voltages, positions | Priority list, maintenance actions |

---

### 3. Prompt Engineering Example (Lines 184-199)

```python
prompt = f"""Analyze this robot performance data and provide insights:

Performance Metrics:
- Average CPU Usage: {data.get('avg_cpu_percent', 0):.2f}%
- Average Memory Usage: {data.get('avg_memory_percent', 0):.2f}%
- Average Temperature: {data.get('avg_temperature', 0):.2f}°C
- Data Points Collected: {data.get('data_points', 0)}
- Time Period: {data.get('period', 'unknown')}

Please provide:
1. A brief analysis (2-3 sentences) of the overall system health
2. Any concerning metrics that need attention
3. 3 specific recommendations to optimize performance

Format your response as JSON with keys: "analysis", "concerns", "recommendations"
Keep the response concise and actionable."""
```

**Key techniques:**
- Structured input with labeled metrics
- Explicit output format (JSON schema)
- Request for actionable recommendations
- Conciseness instruction to minimize token usage

---

### 4. JSON Response Parsing (Lines 204-223)

```python
# Try to parse JSON from response
try:
    response_text = response.text.strip()
    
    # Handle markdown code blocks from Gemini
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0]
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0]
    
    result = json.loads(response_text)
    result["status"] = "success"
    return result
except json.JSONDecodeError:
    # Fallback: Return raw text if JSON parsing fails
    return {
        "analysis": response.text,
        "concerns": [],
        "recommendations": [],
        "status": "success"
    }
```

**Why robust parsing matters:** Gemini sometimes wraps JSON in markdown code blocks. This parsing logic handles all edge cases.

---

### 5. Graceful Degradation

The system works **with or without** AI configured:

```python
# In reports router
if GEMINI_AVAILABLE and gemini_analytics:
    try:
        ai_analysis = await gemini_analytics.analyze_performance_data(data)
    except Exception as e:
        print(f"AI analysis failed: {e}")
        ai_analysis = None  # Report still generated, just without AI

# Report is stored and returned regardless of AI status
```

**Without API key:** Reports are generated with raw data tables only.  
**With API key:** Reports include AI-powered insights sections.

---

### 6. PDF AI Section (Lines 224-243)

When generating PDF reports, AI analysis is embedded with styled formatting:

```python
# Add AI Analysis section if available
if ai_analysis and ai_analysis.get('status') == 'success':
    story.append(Paragraph("🤖 AI-Powered Analysis", heading_style))
    
    if ai_analysis.get('analysis'):
        story.append(Paragraph(f"<b>Analysis:</b> {ai_analysis['analysis']}", ai_style))
    
    if ai_analysis.get('recommendations'):
        story.append(Paragraph("<b>Recommendations:</b>", styles['Normal']))
        for rec in recommendations:
            story.append(Paragraph(f"• {rec}", ai_style))
```

---

## Configuration

### Environment Variables

```bash
# .env file or docker-compose.yml
GEMINI_API_KEY=AIzaSy...your-api-key...
```

### Getting a Free API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy and add to `.env` file

### Free Tier Limits

| Metric | Free Tier Limit |
|--------|-----------------|
| Requests/minute | 60 |
| Tokens/minute | 30,000 |
| Cost | $0.00 |
| Models | gemini-2.0-flash, gemini-1.5-flash |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/reports/ai-status` | GET | Check if AI is configured |
| `/reports/generate?report_type=performance` | POST | Generate performance report with AI |
| `/reports/generate?report_type=job` | POST | Generate job report with AI |
| `/reports/generate?report_type=maintenance` | POST | Generate maintenance report with AI |
| `/reports/{id}/pdf?include_ai=true` | GET | Download PDF with AI sections |

---

## Example AI Output

### Performance Analysis Response

```json
{
  "status": "success",
  "analysis": "The robot is operating within normal parameters. CPU usage at 45% indicates moderate load, while memory usage at 62% suggests adequate headroom. Temperature at 52°C is within safe operating range.",
  "concerns": [
    "Memory usage trending upward over the past 6 hours",
    "Temperature spikes during peak operations"
  ],
  "recommendations": [
    "Monitor memory usage patterns and consider increasing swap space if usage exceeds 80%",
    "Implement cooling breaks during extended high-CPU operations",
    "Schedule non-critical tasks during off-peak hours to distribute load"
  ]
}
```

---

## Summary

The AI layer provides:

1. **Intelligent Analysis** - Context-aware insights instead of raw numbers
2. **Actionable Recommendations** - Specific maintenance actions
3. **Natural Language** - Human-readable summaries for non-technical users
4. **Graceful Fallback** - System works without AI, enhanced with it
5. **Cost Efficiency** - Free tier sufficient for typical usage (~$0/month)

This implementation demonstrates enterprise AI integration patterns suitable for industrial IoT monitoring systems.
