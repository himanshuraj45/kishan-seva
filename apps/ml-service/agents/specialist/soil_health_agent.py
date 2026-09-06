import asyncio
import logging
from dataclasses import dataclass
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
class SoilHealthReport:
    overall_score: int
    N_status: str
    P_status: str
    K_status: str
    pH_status: str
    OC_status: str


@dataclass
class FertilizerPlan:
    total_N_kg: float
    total_P_kg: float
    total_K_kg: float
    split_applications: List[Dict[str, Any]]
    estimated_cost_inr: float
    organic_substitutes: List[str]


@dataclass
class PHCorrectionAdvice:
    amendment_type: str
    quantity_kg_per_acre: float
    application_method: str


@dataclass
class NutrientDeficiency:
    nutrient: str
    severity: str
    symptoms: str
    correction_action: str


class BaseAgent:
    """Base class for all agents."""
    async def process(self, input: AgentInput) -> AgentOutput:
        raise NotImplementedError


class SoilHealthAgent(BaseAgent):
    """
    Agent responsible for analyzing soil data and generating fertilizer plans.
    """
    
    # NPK recommendation tables by crop (kg/ha)
    NPK_RECOMMENDATIONS = {
        "tomato": {"N": 180, "P": 60, "K": 60},
        "wheat": {"N": 120, "P": 60, "K": 40},
        "rice": {"N": 100, "P": 50, "K": 50},
        "default": {"N": 100, "P": 50, "K": 50}
    }
    
    def __init__(self) -> None:
        """Initializes the SoilHealthAgent."""
        pass

    async def process(self, input: AgentInput) -> AgentOutput:
        """
        Processes soil data to generate health reports and fertilizer plans.
        """
        context = input.context
        soil_data = context.get('soil_data')
        crop = context.get('crop', '').lower()
        stage = context.get('stage', 'pre_sowing')
        area_acres = context.get('area_acres', 1.0)
        
        if not soil_data:
            return AgentOutput(status="error", error="Soil data is required", data={})
            
        try:
            # 1. Assess Health
            report = self._assess_soil_health(soil_data)
            
            # 2. Fertilizer Plan
            plan = self._compute_fertilizer_dose(soil_data, crop, stage, area_acres)
            
            # 3. pH Correction
            ph = soil_data.get('pH', 7.0)
            ph_correction = self._check_ph_correction_needed(ph, crop)
            
            # 4. Schedule
            schedule = self._generate_weekly_schedule(plan, stage)
            
            # 5. Deficiencies
            visual_symptoms = context.get('visual_symptoms', [])
            deficiencies = self._detect_deficiencies(soil_data, visual_symptoms)
            
            response_data = {
                "health_report": report.__dict__,
                "fertilizer_plan": plan.__dict__,
                "ph_correction": ph_correction.__dict__ if ph_correction else None,
                "schedule": schedule,
                "detected_deficiencies": [d.__dict__ for d in deficiencies]
            }
            
            return AgentOutput(status="success", data=response_data)
            
        except Exception as e:
            logger.exception("Error during soil health processing")
            return AgentOutput(status="error", error=str(e), data={})

    def _assess_soil_health(self, soil: Dict[str, float]) -> SoilHealthReport:
        """Assesses raw soil metrics into status categories."""
        n = soil.get('N', 0.0)
        p = soil.get('P', 0.0)
        k = soil.get('K', 0.0)
        ph = soil.get('pH', 7.0)
        oc = soil.get('OC', 0.5)
        
        def evaluate_macronutrient(val, low, high):
            if val < low: return 'deficient'
            if val > high: return 'excess'
            return 'optimal'
            
        # Thresholds (mock standard values in kg/ha)
        n_status = evaluate_macronutrient(n, 280, 560)
        p_status = evaluate_macronutrient(p, 10, 25)
        k_status = evaluate_macronutrient(k, 110, 280)
        
        if ph < 6.0: ph_status = 'acidic'
        elif ph > 8.5: ph_status = 'alkaline'
        else: ph_status = 'optimal'
        
        if oc < 0.5: oc_status = 'deficient'
        elif oc > 0.75: oc_status = 'excess' # generally good but following pattern
        else: oc_status = 'optimal'
        
        score = 100
        penalties = {'deficient': 15, 'excess': 10, 'acidic': 20, 'alkaline': 20}
        for status in [n_status, p_status, k_status, ph_status, oc_status]:
            score -= penalties.get(status, 0)
            
        return SoilHealthReport(
            overall_score=max(0, score),
            N_status=n_status,
            P_status=p_status,
            K_status=k_status,
            pH_status=ph_status,
            OC_status=oc_status
        )

    def _compute_fertilizer_dose(self, soil: Dict[str, float], crop: str, stage: str, area_acres: float) -> FertilizerPlan:
        """Computes the required fertilizer dose based on soil test and crop recommendations."""
        rec = self.NPK_RECOMMENDATIONS.get(crop, self.NPK_RECOMMENDATIONS["default"])
        
        # Base recommendations in kg/ha
        rec_n = rec["N"]
        rec_p = rec["P"]
        rec_k = rec["K"]
        
        # Adjust based on soil status (very simplistic logic)
        status = self._assess_soil_health(soil)
        
        if status.N_status == 'deficient': rec_n *= 1.25
        elif status.N_status == 'excess': rec_n *= 0.75
        
        if status.P_status == 'deficient': rec_p *= 1.25
        elif status.P_status == 'excess': rec_p *= 0.75
        
        if status.K_status == 'deficient': rec_k *= 1.25
        elif status.K_status == 'excess': rec_k *= 0.75
        
        # Convert kg/ha to kg/acre (1 hectare = 2.47105 acres)
        ha_to_acre = 2.47105
        total_n = (rec_n / ha_to_acre) * area_acres
        total_p = (rec_p / ha_to_acre) * area_acres
        total_k = (rec_k / ha_to_acre) * area_acres
        
        # Split applications
        splits = [
            {"timing": "basal (pre-sowing)", "N_pct": 50, "P_pct": 100, "K_pct": 50},
            {"timing": "vegetative stage", "N_pct": 25, "P_pct": 0, "K_pct": 25},
            {"timing": "flowering stage", "N_pct": 25, "P_pct": 0, "K_pct": 25}
        ]
        
        return FertilizerPlan(
            total_N_kg=round(total_n, 1),
            total_P_kg=round(total_p, 1),
            total_K_kg=round(total_k, 1),
            split_applications=splits,
            estimated_cost_inr=round((total_n * 15) + (total_p * 25) + (total_k * 30), 2),
            organic_substitutes=["Vermicompost (2 tons/acre)", "FYM (5 tons/acre)"]
        )

    def _check_ph_correction_needed(self, ph: float, crop: str) -> Optional[PHCorrectionAdvice]:
        """Checks if pH amendment is needed."""
        if ph < 5.5:
            return PHCorrectionAdvice("Agricultural Lime", 500.0, "Broadcast and incorporate 2-3 weeks before sowing")
        elif ph > 8.5:
            return PHCorrectionAdvice("Gypsum", 1000.0, "Broadcast and mix thoroughly with irrigation")
        return None

    def _generate_weekly_schedule(self, plan: FertilizerPlan, crop_stage: str) -> List[Dict[str, Any]]:
        """Generates a weekly schedule based on the fertilizer plan and crop stage."""
        schedule = []
        if crop_stage == 'pre_sowing':
            schedule.append({
                "week": 1,
                "action": "Basal Dose Application",
                "details": f"Apply {plan.total_N_kg * 0.5:.1f}kg N, {plan.total_P_kg:.1f}kg P, {plan.total_K_kg * 0.5:.1f}kg K"
            })
        return schedule

    def _detect_deficiencies(self, soil: Dict[str, float], visual_symptoms: List[str]) -> List[NutrientDeficiency]:
        """Detects nutrient deficiencies based on soil data and visual symptoms."""
        deficiencies = []
        report = self._assess_soil_health(soil)
        
        if report.N_status == 'deficient' or "yellowing of older leaves" in visual_symptoms:
            deficiencies.append(NutrientDeficiency(
                "Nitrogen", "high", "Yellowing of older leaves, stunted growth", "Apply Urea or N-rich fertilizer immediately"
            ))
            
        if report.K_status == 'deficient' or "burned leaf edges" in visual_symptoms:
            deficiencies.append(NutrientDeficiency(
                "Potassium", "moderate", "Burned leaf edges, weak stems", "Apply Muriate of Potash (MOP)"
            ))
            
        return deficiencies
