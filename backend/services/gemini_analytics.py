"""
Gemini AI Analytics Service for Robot Data Analysis

This service uses Google's Gemini API (free tier) to analyze robot sensor data
and generate insights for PDF reports.
"""

import os
from typing import Dict, List, Any, Optional
from datetime import datetime
import json

# Try to import google generativeai
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: google-generativeai not installed. AI analysis will be disabled.")


class GeminiAnalytics:
    """
    Gemini-powered analytics for robot monitoring data.
    Uses the free tier of Gemini API.
    """
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = None
        
        if GEMINI_AVAILABLE and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                # Use gemini-1.5-flash for free tier (faster, lower cost)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                print("Gemini AI: Initialized successfully")
            except Exception as e:
                print(f"Gemini AI: Failed to initialize - {e}")
                self.model = None
        else:
            if not GEMINI_AVAILABLE:
                print("Gemini AI: Library not installed")
            if not self.api_key:
                print("Gemini AI: API key not configured (set GEMINI_API_KEY in environment)")
    
    def is_available(self) -> bool:
        """Check if Gemini is available and configured"""
        return self.model is not None
    
    async def analyze_performance_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze performance data and generate insights.
        
        Args:
            data: Dictionary containing performance metrics like:
                - avg_cpu_percent
                - avg_memory_percent  
                - avg_temperature
                - data_points
                - period
        
        Returns:
            Dictionary with analysis results and recommendations
        """
        if not self.is_available():
            return {
                "analysis": "AI analysis not available",
                "recommendations": ["Configure GEMINI_API_KEY to enable AI-powered insights"],
                "status": "unavailable"
            }
        
        try:
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

            response = self.model.generate_content(prompt)
            
            # Try to parse JSON from response
            try:
                # Extract JSON from response text
                response_text = response.text.strip()
                # Handle markdown code blocks
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0]
                
                result = json.loads(response_text)
                result["status"] = "success"
                return result
            except json.JSONDecodeError:
                # Return raw text if JSON parsing fails
                return {
                    "analysis": response.text,
                    "concerns": [],
                    "recommendations": [],
                    "status": "success"
                }
                
        except Exception as e:
            return {
                "analysis": f"Error during analysis: {str(e)}",
                "concerns": [],
                "recommendations": [],
                "status": "error"
            }
    
    async def analyze_job_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze job completion data and generate insights.
        
        Args:
            data: Dictionary containing job metrics like:
                - start_time
                - end_time
                - items_processed
                - items_total
                - percent_complete
                - status
        
        Returns:
            Dictionary with analysis results and recommendations
        """
        if not self.is_available():
            return {
                "analysis": "AI analysis not available",
                "recommendations": ["Configure GEMINI_API_KEY to enable AI-powered insights"],
                "status": "unavailable"
            }
        
        try:
            # Calculate duration if times are available
            duration = "unknown"
            if data.get('start_time') and data.get('end_time'):
                try:
                    start = datetime.fromisoformat(str(data['start_time']).replace('Z', '+00:00'))
                    end = datetime.fromisoformat(str(data['end_time']).replace('Z', '+00:00'))
                    duration = str(end - start)
                except:
                    pass
            
            prompt = f"""Analyze this robot job/task data and provide insights:

Job Metrics:
- Status: {data.get('status', 'unknown')}
- Items Processed: {data.get('items_processed', 0)} / {data.get('items_total', 0)}
- Completion Rate: {data.get('percent_complete', 0):.1f}%
- Duration: {duration}
- Start Time: {data.get('start_time', 'N/A')}
- End Time: {data.get('end_time', 'In Progress')}

Please provide:
1. A brief analysis (2-3 sentences) of job performance
2. Efficiency assessment (is the processing rate good?)
3. 2-3 recommendations to improve job throughput

Format your response as JSON with keys: "analysis", "efficiency", "recommendations"
Keep the response concise and actionable."""

            response = self.model.generate_content(prompt)
            
            # Try to parse JSON from response
            try:
                response_text = response.text.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0]
                
                result = json.loads(response_text)
                result["status"] = "success"
                return result
            except json.JSONDecodeError:
                return {
                    "analysis": response.text,
                    "efficiency": "Unable to assess",
                    "recommendations": [],
                    "status": "success"
                }
                
        except Exception as e:
            return {
                "analysis": f"Error during analysis: {str(e)}",
                "efficiency": "Error",
                "recommendations": [],
                "status": "error"
            }
    
    async def analyze_servo_data(self, servo_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze servo data and provide maintenance recommendations.
        
        Args:
            servo_data: Dictionary containing servo metrics like:
                - servos: dict of servo_name -> {temperature, voltage, position, etc.}
                - servo_count: number of servos
                - robot_id: robot identifier
        
        Returns:
            Dictionary with maintenance analysis and recommendations
        """
        if not self.is_available():
            return {
                "analysis": "AI analysis not available",
                "maintenance_priority": [],
                "recommendations": ["Configure GEMINI_API_KEY to enable AI-powered maintenance insights"],
                "status": "unavailable"
            }
        
        try:
            servos = servo_data.get('servos', {})
            if not servos:
                return {
                    "analysis": "No servo data available for analysis",
                    "maintenance_priority": [],
                    "recommendations": ["Ensure servo data is being collected from the robot"],
                    "status": "no_data"
                }
            
            # Build servo summary for the prompt
            servo_summary = []
            for servo_name, info in servos.items():
                servo_summary.append(f"- {servo_name} (ID: {info.get('id', 'N/A')}): "
                                   f"Temp={info.get('temperature', 'N/A')}°C, "
                                   f"Voltage={info.get('voltage', 'N/A')}V, "
                                   f"Position={info.get('position', 'N/A')}, "
                                   f"Alert={info.get('alert_level', 'normal')}")
            
            prompt = f"""Analyze this robot servo data and provide maintenance recommendations:

Robot ID: {servo_data.get('robot_id', 'Unknown')}
Total Servos: {servo_data.get('servo_count', len(servos))}

Servo Status:
{chr(10).join(servo_summary)}

IMPORTANT THRESHOLDS FOR SERVO HEALTH:
- Normal temperature: 25-45°C
- Warning temperature: 45-60°C (needs monitoring)
- Critical temperature: >60°C (immediate attention required)
- Normal voltage: 6.0-8.4V (for typical hobby servos)
- Low voltage: <6.0V (power supply issues)

Please provide:
1. A brief overall assessment (2-3 sentences) of servo health status
2. List any servos that need maintenance attention, prioritized by urgency (critical first)
3. For each problematic servo, explain the issue and recommended action
4. 3-4 general maintenance recommendations

Format your response as JSON with keys: 
- "analysis": overall assessment string
- "maintenance_priority": array of objects with "servo_name", "urgency" (critical/warning/normal), "issue", "action"
- "recommendations": array of general maintenance tips
Keep the response concise and actionable."""

            response = self.model.generate_content(prompt)
            
            # Try to parse JSON from response
            try:
                response_text = response.text.strip()
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0]
                
                result = json.loads(response_text)
                result["status"] = "success"
                return result
            except json.JSONDecodeError:
                return {
                    "analysis": response.text,
                    "maintenance_priority": [],
                    "recommendations": [],
                    "status": "success"
                }
                
        except Exception as e:
            return {
                "analysis": f"Error during servo analysis: {str(e)}",
                "maintenance_priority": [],
                "recommendations": [],
                "status": "error"
            }

    async def generate_summary(self, 
                               performance_data: Optional[Dict] = None,
                               job_data: Optional[Dict] = None,
                               robot_id: Optional[str] = None) -> str:
        """
        Generate a comprehensive summary for a PDF report.
        
        Returns:
            A formatted text summary suitable for inclusion in a PDF report.
        """
        if not self.is_available():
            return "AI-powered summary not available. Configure GEMINI_API_KEY to enable this feature."
        
        try:
            prompt = f"""Generate a professional executive summary for a robot monitoring report.

Robot ID: {robot_id or 'All Robots'}

{"Performance Data:" if performance_data else ""}
{json.dumps(performance_data, indent=2) if performance_data else "No performance data available"}

{"Job Data:" if job_data else ""}
{json.dumps(job_data, indent=2) if job_data else "No job data available"}

Write a 3-4 paragraph executive summary that:
1. Summarizes the overall operational status
2. Highlights key achievements and concerns
3. Provides actionable next steps

Keep it professional and concise."""

            response = self.model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            return f"Error generating summary: {str(e)}"


# Global instance
gemini_analytics = GeminiAnalytics()








