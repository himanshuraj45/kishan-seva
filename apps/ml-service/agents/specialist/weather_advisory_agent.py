import asyncio
import logging
import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class AgentInput:
    """Input structure for agents."""
    context: Dict[str, Any]


@dataclass
class AgentOutput:
    """Output structure for agents."""
    status: str
    data: Dict[str, Any]
    error: Optional[str] = None


@dataclass
class WeatherSummary:
    """Summary of weather metrics for a day."""
    temp: float
    humidity: float
    rainfall_24h: float
    evapotranspiration: float
    wind_speed: float
    date: str


@dataclass
class IrrigationRecommendation:
    """Recommendation for irrigation."""
    amount_mm: float
    urgency: str
    reason: str
    next_irrigation_date: str
    water_stress_index: float


@dataclass
class DiseaseRiskAssessment:
    """Assessment of disease risks based on weather."""
    overall_risk: str
    fungal_risk: str
    bacterial_risk: str
    pest_risk: str
    risk_factors: List[str]


@dataclass
class SprayWindowAdvice:
    """Advice on the best time to spray chemicals."""
    best_time_window: str
    avoid_before_rain_hrs: int
    wind_ok: bool


@dataclass
class DaySchedule:
    """Schedule for a single day."""
    date: str
    irrigate: bool
    irrigation_mm: float
    fertilize: bool
    fertilizer_type: str
    notes: str


class BaseAgent:
    """Base class for all agents."""
    async def process(self, input: AgentInput) -> AgentOutput:
        raise NotImplementedError


class WeatherAdvisoryAgent(BaseAgent):
    """
    Agent responsible for generating weather-based advisories.
    """
    
    def __init__(self) -> None:
        """Initializes the WeatherAdvisoryAgent."""
        # Crop coefficient (Kc) table for simplified ET0 calculations
        self.kc_table = {
            "tomato": {"initial": 0.6, "mid": 1.15, "late": 0.8},
            "wheat": {"initial": 0.3, "mid": 1.15, "late": 0.25},
            "rice": {"initial": 1.05, "mid": 1.2, "late": 0.9}
        }

    async def process(self, input: AgentInput) -> AgentOutput:
        """
        Processes the input context to generate weather advisories.
        
        Args:
            input: Contains 'lat', 'lon', 'plot', 'forecast'.
            
        Returns:
            AgentOutput containing various agricultural recommendations.
        """
        context = input.context
        lat = context.get('lat')
        lon = context.get('lon')
        plot = context.get('plot', {})
        forecast = context.get('forecast', {})
        crop_name = plot.get('crop', '').lower()
        
        if not forecast:
            return AgentOutput(status="error", error="No forecast data provided", data={})
            
        try:
            # Parse next 7 days weather
            forecast_list = forecast.get('daily', [])
            if not forecast_list:
                # Mock if missing
                forecast_list = [self._mock_daily_forecast(i) for i in range(7)]
                
            weather_7day = [self._parse_weather(day) for day in forecast_list[:7]]
            current_weather = weather_7day[0]
            
            # Compute Advisories
            irrigation_rec = self._compute_irrigation_need(current_weather, plot)
            disease_risk = self._compute_disease_risk(current_weather, crop_name)
            spray_window = self._compute_spray_window(current_weather)
            weekly_schedule = self._generate_weekly_schedule(weather_7day, plot)
            
            response_data = {
                "weather_summary": current_weather.__dict__,
                "irrigation": irrigation_rec.__dict__,
                "disease_risk": disease_risk.__dict__,
                "spray_window": spray_window.__dict__,
                "weekly_schedule": [day.__dict__ for day in weekly_schedule]
            }
            
            return AgentOutput(status="success", data=response_data)
            
        except Exception as e:
            logger.exception("Error during weather advisory process")
            return AgentOutput(status="error", error=str(e), data={})

    def _mock_daily_forecast(self, offset_days: int) -> Dict[str, Any]:
        """Generates a mock forecast entry."""
        dt = datetime.now() + timedelta(days=offset_days)
        return {
            "dt": int(dt.timestamp()),
            "temp": {"day": 28.0 + offset_days},
            "humidity": 65 + offset_days,
            "rain": 0.0 if offset_days % 3 != 0 else 15.0,
            "wind_speed": 3.5
        }

    def _parse_weather(self, day_data: Dict[str, Any]) -> WeatherSummary:
        """Parses raw API weather data into a WeatherSummary."""
        temp = day_data.get('temp', {}).get('day', 25.0)
        humidity = day_data.get('humidity', 60.0)
        rainfall = day_data.get('rain', 0.0)
        wind_speed = day_data.get('wind_speed', 2.0)
        
        # Simplified ET0 (Evapotranspiration) using Hargreaves method approximation
        # ET0 = 0.0023 * (Tmean + 17.8) * (Tmax - Tmin)^0.5 * Ra
        # Here we use a very naive approximation based on temp and humidity
        et0 = (temp * 0.46) * (1 - (humidity/100)) + (wind_speed * 0.2)
        
        dt_sec = day_data.get('dt', int(datetime.now().timestamp()))
        date_str = datetime.fromtimestamp(dt_sec).strftime('%Y-%m-%d')
        
        return WeatherSummary(
            temp=temp,
            humidity=humidity,
            rainfall_24h=rainfall,
            evapotranspiration=max(0.1, et0),
            wind_speed=wind_speed,
            date=date_str
        )

    def _compute_irrigation_need(self, weather: WeatherSummary, plot: Dict[str, Any]) -> IrrigationRecommendation:
        """Computes irrigation requirements using simplified Penman-Monteith / Crop Coefficient."""
        crop = plot.get('crop', 'unknown').lower()
        stage = plot.get('stage', 'mid')
        soil_moisture = plot.get('soil_moisture', 50.0) # percentage
        
        # Get Kc
        kc = self.kc_table.get(crop, {}).get(stage, 1.0)
        
        # Crop Evapotranspiration (ETc)
        etc = weather.evapotranspiration * kc
        
        # Effective rainfall (simplified: 80% of rain > 5mm)
        eff_rain = (weather.rainfall_24h - 5) * 0.8 if weather.rainfall_24h > 5 else 0
        
        # Deficit
        deficit = etc - eff_rain
        
        # Soil moisture logic
        if soil_moisture < 30:
            urgency = "high"
            reason = "Critical soil moisture levels detected."
        elif deficit > 5:
            urgency = "medium"
            reason = f"High evapotranspiration ({etc:.1f}mm) exceeds rainfall."
        else:
            urgency = "low"
            reason = "Adequate moisture from recent rain."
            
        next_date = (datetime.now() + timedelta(days=2 if urgency=="high" else 5)).strftime('%Y-%m-%d')
        
        return IrrigationRecommendation(
            amount_mm=max(0.0, deficit * 1.2), # Add 20% for efficiency losses
            urgency=urgency,
            reason=reason,
            next_irrigation_date=next_date,
            water_stress_index=100 - soil_moisture
        )

    def _compute_disease_risk(self, weather: WeatherSummary, crop_name: str) -> DiseaseRiskAssessment:
        """Computes disease risk based on weather parameters."""
        fungal_risk = "low"
        bacterial_risk = "low"
        pest_risk = "low"
        factors = []
        
        if weather.humidity > 80 and 20 <= weather.temp <= 30:
            fungal_risk = "high"
            factors.append("High humidity and moderate temperatures favor fungal growth.")
        elif weather.humidity > 70:
            fungal_risk = "moderate"
            
        if weather.temp > 35:
            pest_risk = "high"
            factors.append("High temperatures increase pest metabolic rates.")
            
        if weather.rainfall_24h > 10 and weather.temp > 25:
            bacterial_risk = "moderate"
            factors.append("Warm and wet conditions favor bacterial spread.")
            
        risks = [fungal_risk, bacterial_risk, pest_risk]
        if "high" in risks:
            overall = "high"
        elif "moderate" in risks:
            overall = "moderate"
        else:
            overall = "low"
            
        return DiseaseRiskAssessment(
            overall_risk=overall,
            fungal_risk=fungal_risk,
            bacterial_risk=bacterial_risk,
            pest_risk=pest_risk,
            risk_factors=factors
        )

    def _compute_spray_window(self, weather: WeatherSummary) -> SprayWindowAdvice:
        """Determines the best time for pesticide application."""
        wind_ok = weather.wind_speed < 15.0 # km/h
        
        if weather.rainfall_24h > 2.0:
            best_time = "Avoid spraying (rain expected)"
        elif not wind_ok:
            best_time = "Avoid spraying (high winds)"
        elif weather.temp > 30:
            best_time = "Early morning (6 AM - 9 AM) or Late evening"
        else:
            best_time = "Morning or afternoon"
            
        return SprayWindowAdvice(
            best_time_window=best_time,
            avoid_before_rain_hrs=24,
            wind_ok=wind_ok
        )

    def _generate_weekly_schedule(self, weather_7day: List[WeatherSummary], plot: Dict[str, Any]) -> List[DaySchedule]:
        """Generates a day-by-day schedule for the next week based on weather."""
        schedule = []
        soil_moisture = plot.get('soil_moisture', 50.0)
        
        for i, day_weather in enumerate(weather_7day):
            irrigate = False
            irrigation_mm = 0.0
            fertilize = False
            notes = []
            
            # Simulate soil drying/wetting
            soil_moisture -= (day_weather.evapotranspiration * 0.5)
            if day_weather.rainfall_24h > 0:
                soil_moisture += (day_weather.rainfall_24h * 2)
                
            if soil_moisture < 40 and day_weather.rainfall_24h < 5:
                irrigate = True
                irrigation_mm = 15.0
                soil_moisture += 30 # Simulate irrigation
                notes.append("Irrigate to maintain soil moisture.")
                
            if day_weather.rainfall_24h > 20:
                notes.append("Heavy rain expected. Ensure drainage.")
                
            schedule.append(DaySchedule(
                date=day_weather.date,
                irrigate=irrigate,
                irrigation_mm=irrigation_mm,
                fertilize=fertilize,
                fertilizer_type="N/A",
                notes=" ".join(notes) if notes else "Favorable conditions."
            ))
            
        return schedule
