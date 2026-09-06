import asyncio
import logging
import math
from dataclasses import dataclass
from datetime import datetime
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
class Cluster:
    center_lat: float
    center_lon: float
    radius_km: float
    disease: str
    crop: str
    count: int
    first_seen: str
    latest_seen: str
    growth_rate: float


@dataclass
class TrendInfo:
    is_accelerating: bool
    growth_factor: float
    description: str


@dataclass
class OutbreakAlert:
    cluster_id: str
    alert_level: str
    disease: str
    crop: str
    affected_villages: List[str]
    recommended_actions: List[str]


class BaseAgent:
    """Base class for all agents."""
    async def process(self, input: AgentInput) -> AgentOutput:
        raise NotImplementedError


class OutbreakDetectionAgent(BaseAgent):
    """
    Agent responsible for detecting disease outbreaks based on regional data.
    """
    
    def __init__(self) -> None:
        """Initializes the OutbreakDetectionAgent."""
        pass

    async def process(self, input: AgentInput) -> AgentOutput:
        """
        Processes recent diagnoses to detect regional outbreaks.
        """
        context = input.context
        recent_diagnoses = context.get('recent_diagnoses', [])
        region = context.get('region', {})
        time_window_days = context.get('time_window_days', 7)
        
        if not recent_diagnoses:
            return AgentOutput(status="success", data={"alerts": [], "message": "No recent diagnoses provided."})
            
        try:
            # 1. Filter
            high_conf_data = self._filter_high_confidence(recent_diagnoses, threshold=0.70)
            
            # 2. Cluster
            clusters = self._spatial_clustering(high_conf_data)
            
            # 3. Temporal Analysis
            trend_info = self._temporal_analysis(clusters)
            
            alerts = []
            for i, cluster in enumerate(clusters):
                # 4. Compute Score
                score = self._compute_outbreak_score(cluster)
                
                # 5. Generate Alert
                alert = self._generate_alert(cluster, score, f"CLUSTER_{i}")
                if alert:
                    alerts.append(alert)
                    
            # 6. Surveillance Recommendations
            surveillance_actions = self._recommend_surveillance(alerts)
            
            response_data = {
                "clusters": [c.__dict__ for c in clusters],
                "alerts": [a.__dict__ for a in alerts],
                "trend_analysis": trend_info.__dict__ if trend_info else None,
                "surveillance_recommendations": surveillance_actions,
                "map_data": self._format_map_data(clusters)
            }
            
            return AgentOutput(status="success", data=response_data)
            
        except Exception as e:
            logger.exception("Error during outbreak detection")
            return AgentOutput(status="error", error=str(e), data={})

    def _filter_high_confidence(self, diagnoses: List[Dict[str, Any]], threshold: float) -> List[Dict[str, Any]]:
        """Filters diagnoses based on confidence threshold."""
        return [d for d in diagnoses if d.get('confidence', 0.0) >= threshold]

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

    def _spatial_clustering(self, diagnoses: List[Dict[str, Any]]) -> List[Cluster]:
        """Clusters diagnoses using a simplified grid/radius approach."""
        # Simple greedy clustering
        clusters = []
        radius_threshold = 5.0 # 5km
        
        # Group by disease and crop first
        grouped = {}
        for d in diagnoses:
            key = (d.get('disease'), d.get('crop'))
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(d)
            
        for (disease, crop), items in grouped.items():
            used = set()
            for i, item1 in enumerate(items):
                if i in used:
                    continue
                    
                lat1, lon1 = item1.get('lat', 0.0), item1.get('lon', 0.0)
                cluster_items = [item1]
                used.add(i)
                
                for j, item2 in enumerate(items):
                    if j in used:
                        continue
                    lat2, lon2 = item2.get('lat', 0.0), item2.get('lon', 0.0)
                    if self._haversine_distance(lat1, lon1, lat2, lon2) <= radius_threshold:
                        cluster_items.append(item2)
                        used.add(j)
                        
                if len(cluster_items) >= 2: # Min size to be a cluster
                    # Calculate centroid
                    c_lat = sum(x.get('lat', 0.0) for x in cluster_items) / len(cluster_items)
                    c_lon = sum(x.get('lon', 0.0) for x in cluster_items) / len(cluster_items)
                    
                    # Sort by timestamp
                    timestamps = [x.get('timestamp', '') for x in cluster_items if x.get('timestamp')]
                    timestamps.sort()
                    first_seen = timestamps[0] if timestamps else ""
                    latest_seen = timestamps[-1] if timestamps else ""
                    
                    clusters.append(Cluster(
                        center_lat=c_lat,
                        center_lon=c_lon,
                        radius_km=radius_threshold,
                        disease=disease or "unknown",
                        crop=crop or "unknown",
                        count=len(cluster_items),
                        first_seen=first_seen,
                        latest_seen=latest_seen,
                        growth_rate=1.5 # Mock growth rate
                    ))
                    
        return clusters

    def _temporal_analysis(self, clusters: List[Cluster]) -> TrendInfo:
        """Analyzes clusters over time to detect acceleration."""
        if not clusters:
            return TrendInfo(False, 1.0, "No active clusters.")
            
        avg_growth = sum(c.growth_rate for c in clusters) / len(clusters)
        is_accel = avg_growth > 1.2
        
        return TrendInfo(
            is_accelerating=is_accel,
            growth_factor=round(avg_growth, 2),
            description="Outbreak is spreading rapidly." if is_accel else "Outbreak seems contained."
        )

    def _compute_outbreak_score(self, cluster: Cluster) -> float:
        """Computes a normalized score (0-1) for outbreak severity."""
        # Threshold: 3+ cases = warning, 8+ = emergency
        if cluster.count >= 8:
            return 0.9
        elif cluster.count >= 3:
            return 0.6
        return 0.2

    def _generate_alert(self, cluster: Cluster, score: float, c_id: str) -> Optional[OutbreakAlert]:
        """Generates an OutbreakAlert based on the score."""
        if score >= 0.8:
            level = 'emergency'
            actions = [
                "Deploy extension workers immediately.",
                "Broadcast SMS alerts to all farmers in 10km radius.",
                "Stockpile fungicides at local mandis."
            ]
        elif score >= 0.5:
            level = 'warning'
            actions = [
                "Monitor region closely.",
                "Send preventive advisory via app."
            ]
        else:
            return None # 'watch' or below doesn't trigger formal alert here
            
        return OutbreakAlert(
            cluster_id=c_id,
            alert_level=level,
            disease=cluster.disease,
            crop=cluster.crop,
            affected_villages=["Village A", "Village B"], # Mocked
            recommended_actions=actions
        )

    def _recommend_surveillance(self, alerts: List[OutbreakAlert]) -> List[str]:
        """Generates actionable surveillance recommendations."""
        recs = set()
        for alert in alerts:
            recs.add(f"Targeted drone survey in {', '.join(alert.affected_villages)} for {alert.disease}.")
        return list(recs)
        
    def _format_map_data(self, clusters: List[Cluster]) -> List[Dict[str, Any]]:
        return [{"lat": c.center_lat, "lon": c.center_lon, "radius": c.radius_km, "label": f"{c.disease} ({c.count} cases)"} for c in clusters]
