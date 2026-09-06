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
class TrendAnalysis:
    """Analysis of historical price trends."""
    direction: str
    slope_per_day: float
    days_since_peak: int
    volatility: float
    seasonal_pattern: str


@dataclass
class SellTimingAdvice:
    """Recommendations on when to sell."""
    recommended_action: str
    confidence: float
    reasoning: str
    expected_price_at_recommended_time: float


@dataclass
class FPOOpportunity:
    """Farmer Producer Organization aggregation opportunity."""
    fpo_name: str
    collective_price: float
    individual_price: float
    extra_per_quintal: float
    min_quantity: float


@dataclass
class AlertSuggestion:
    """Price alert suggestion based on trends."""
    target_price: float
    message: str


class BaseAgent:
    """Base class for all agents."""
    async def process(self, input: AgentInput) -> AgentOutput:
        raise NotImplementedError


class MandiPriceAgent(BaseAgent):
    """
    Agent responsible for providing market intelligence and mandi prices.
    """
    
    def __init__(self) -> None:
        """Initializes the MandiPriceAgent."""
        pass

    async def process(self, input: AgentInput) -> AgentOutput:
        """
        Processes market data to provide actionable selling advice.
        
        Args:
            input: Contains 'commodity', 'state', 'farmer_location', 'current_prices', 'plot_data'.
            
        Returns:
            AgentOutput containing mandi rankings and selling advice.
        """
        context = input.context
        commodity = context.get('commodity')
        state = context.get('state')
        farmer_loc = context.get('farmer_location', {'lat': 0.0, 'lon': 0.0})
        current_prices = context.get('current_prices', [])
        historical_prices = context.get('historical_prices', [])
        plot_data = context.get('plot_data', {})
        
        if not commodity or not current_prices:
            return AgentOutput(status="error", error="Commodity and current_prices are required", data={})
            
        try:
            # 1. Rank Mandis
            ranked_mandis = self._rank_mandis(current_prices, farmer_loc)
            
            # 2. Trend Analysis
            trend = self._detect_price_trend(historical_prices)
            
            # 3. Sell Timing Advice
            crop_stage = plot_data.get('stage', 'harvest')
            weather_forecast = context.get('weather_forecast', {})
            sell_advice = self._predict_sell_timing(trend, crop_stage, weather_forecast)
            
            # 4. FPO Opportunities
            volume_tonnes = plot_data.get('expected_yield_tonnes', 1.0)
            fpo_opportunity = self._find_best_fpo_opportunity(current_prices, volume_tonnes)
            
            # 5. Price Alerts
            current_best_price = ranked_mandis[0]['price'] if ranked_mandis else 0.0
            alert = self._generate_price_alert_suggestion(current_best_price, trend)
            
            response_data = {
                "ranked_mandis": ranked_mandis,
                "trend_analysis": trend.__dict__,
                "sell_timing": sell_advice.__dict__,
                "fpo_opportunity": fpo_opportunity.__dict__ if fpo_opportunity else None,
                "price_alert": alert.__dict__ if alert else None
            }
            
            return AgentOutput(status="success", data=response_data)
            
        except Exception as e:
            logger.exception("Error during mandi price processing")
            return AgentOutput(status="error", error=str(e), data={})

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates distance between two coordinates in km."""
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) * math.sin(dlon / 2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def _compute_net_value(self, price: float, distance_km: float) -> float:
        """
        Computes the net value of the price after transport costs.
        Transport cost estimation: ₹8/km/tonne for distances under 50km, ₹6/km beyond.
        Assumes price is per quintal (100kg). Transport cost needs to be per quintal (divide by 10).
        """
        if distance_km <= 50:
            transport_cost_per_tonne = 8.0 * distance_km
        else:
            transport_cost_per_tonne = (8.0 * 50) + (6.0 * (distance_km - 50))
            
        transport_cost_per_quintal = transport_cost_per_tonne / 10.0
        return float(max(0.0, price - transport_cost_per_quintal))

    def _rank_mandis(self, prices: List[Dict[str, Any]], farmer_loc: Dict[str, float]) -> List[Dict[str, Any]]:
        """Ranks mandis based on net value to the farmer."""
        ranked = []
        for mandi in prices:
            lat = mandi.get('lat', 0.0)
            lon = mandi.get('lon', 0.0)
            price = mandi.get('price', 0.0)
            
            # If coordinates are missing, assume 30km distance
            if lat == 0.0 and lon == 0.0:
                dist = 30.0
            else:
                dist = self._haversine_distance(farmer_loc['lat'], farmer_loc['lon'], lat, lon)
                
            net_val = self._compute_net_value(price, dist)
            
            ranked.append({
                "mandi_name": mandi.get('name', 'Unknown'),
                "distance_km": round(dist, 1),
                "price_per_quintal": price,
                "net_value_per_quintal": round(net_val, 2)
            })
            
        # Sort by highest net value
        ranked.sort(key=lambda x: x['net_value_per_quintal'], reverse=True)
        return ranked

    def _detect_price_trend(self, historical_prices: List[float]) -> TrendAnalysis:
        """Analyzes historical prices to detect trends."""
        if not historical_prices or len(historical_prices) < 2:
            return TrendAnalysis("stable", 0.0, 0, 0.0, "unknown")
            
        # Basic linear slope
        y = historical_prices
        x = list(range(len(y)))
        slope = (y[-1] - y[0]) / len(y)
        
        peak_idx = y.index(max(y))
        days_since_peak = len(y) - 1 - peak_idx
        
        mean_price = sum(y) / len(y)
        volatility = sum((price - mean_price)**2 for price in y) / len(y)
        volatility = math.sqrt(volatility)
        
        if slope > 5:
            direction = "up"
        elif slope < -5:
            direction = "down"
        else:
            direction = "stable"
            
        return TrendAnalysis(
            direction=direction,
            slope_per_day=round(slope, 2),
            days_since_peak=days_since_peak,
            volatility=round(volatility, 2),
            seasonal_pattern="festive_season_approaching" # Mocked
        )

    def _predict_sell_timing(self, trend: TrendAnalysis, crop_stage: str, weather: Dict[str, Any]) -> SellTimingAdvice:
        """Predicts the best time to sell based on trends and conditions."""
        if crop_stage != 'harvest' and crop_stage != 'post_harvest':
            return SellTimingAdvice("wait_until_harvest", 0.9, "Crop not yet ready for harvest.", 0.0)
            
        if trend.direction == "up":
            action = "wait_week"
            reason = "Prices are currently rising. Holding may yield better returns."
            exp_price = 1.05 # 5% increase mock
        elif trend.direction == "down":
            action = "sell_now"
            reason = "Prices are dropping. Sell immediately to avoid further loss."
            exp_price = 0.95
        else:
            action = "sell_partial"
            reason = "Prices are stable. Sell a portion to manage risk."
            exp_price = 1.0
            
        # Modify based on weather (e.g., rain might ruin storage)
        if weather.get('heavy_rain_expected', False):
            action = "sell_now"
            reason = "Heavy rain expected. Sell now to avoid storage damage."
            
        return SellTimingAdvice(
            recommended_action=action,
            confidence=0.8,
            reasoning=reason,
            expected_price_at_recommended_time=exp_price # This should ideally be multiplied by current price
        )

    def _find_best_fpo_opportunity(self, prices: List[Dict[str, Any]], volume_tonnes: float) -> Optional[FPOOpportunity]:
        """Identifies FPO aggregation opportunities."""
        if volume_tonnes < 0.5:
            return None # Too little volume for typical FPO benefits
            
        # Mock FPO data
        avg_mandi_price = sum(p.get('price', 0) for p in prices) / len(prices) if prices else 2000.0
        fpo_price = avg_mandi_price * 1.08 # 8% premium
        
        return FPOOpportunity(
            fpo_name="Kisan Ekta FPO",
            collective_price=round(fpo_price, 2),
            individual_price=round(avg_mandi_price, 2),
            extra_per_quintal=round(fpo_price - avg_mandi_price, 2),
            min_quantity=1.0 # 1 tonne minimum
        )

    def _generate_price_alert_suggestion(self, current_price: float, trend: TrendAnalysis) -> Optional[AlertSuggestion]:
        """Generates a suggestion for a price alert."""
        if current_price <= 0:
            return None
            
        target = current_price * 1.10 # Set alert for 10% higher
        return AlertSuggestion(
            target_price=round(target, 2),
            message=f"Set an alert to be notified when price reaches ₹{round(target, 2)} per quintal."
        )
