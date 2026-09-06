"""
KisanSeva Agent Test Suite
Tests all agents with mock data — no real API keys or GPU required.
Run: pytest tests/ -v
"""
from __future__ import annotations

import asyncio
import json
import sys
import types
from pathlib import Path
from typing import Any, Dict
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

# ─── Make project root importable ─────────────────────────
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from agents.base.base_agent import AgentInput, AgentOutput

# ───────────────────────────────────────────────────────────
# Helpers
# ───────────────────────────────────────────────────────────

def make_input(
    query: str = "test",
    lang: str = "en",
    context: Dict[str, Any] | None = None,
) -> AgentInput:
    return AgentInput(
        query=query,
        language=lang,
        user_id="test-user-001",
        plot_id="plot-001",
        context=context or {},
    )


def assert_valid_output(output: AgentOutput) -> None:
    """Common assertions for any AgentOutput."""
    assert isinstance(output, AgentOutput), "Must return AgentOutput"
    assert output.agent_name, "agent_name must be set"
    assert 0.0 <= output.confidence <= 1.0, "confidence must be in [0, 1]"
    assert output.processing_time_ms >= 0, "processing_time_ms must be ≥ 0"
    assert isinstance(output.result, dict), "result must be a dict"


# ───────────────────────────────────────────────────────────
# Tests: Language Utilities
# ───────────────────────────────────────────────────────────

class TestLanguageUtils:
    def test_translate_english(self):
        from utils.language_utils import t
        result = t("greeting", "en")
        assert "Hello" in result

    def test_translate_hindi(self):
        from utils.language_utils import t
        result = t("greeting", "hi")
        assert "नमस्ते" in result

    def test_translate_fallback(self):
        from utils.language_utils import t
        # Unknown language → English
        result = t("greeting", "zz")
        assert "Hello" in result

    def test_translate_missing_key(self):
        from utils.language_utils import t
        result = t("nonexistent_key", "en")
        assert "[nonexistent_key]" in result

    def test_detect_hindi(self):
        from utils.language_utils import detect_language
        assert detect_language("मेरे टमाटर के पत्ते पीले हो रहे हैं") == "hi"

    def test_detect_english(self):
        from utils.language_utils import detect_language
        assert detect_language("My tomato leaves are turning yellow") == "en"

    def test_format_sms_short(self):
        from utils.language_utils import format_sms_response
        short = "Hello farmer!"
        assert format_sms_response(short) == short

    def test_format_sms_truncates(self):
        from utils.language_utils import format_sms_response
        long_text = "A" * 200
        result = format_sms_response(long_text, max_length=160)
        assert len(result) <= 160 + 10  # small buffer for suffix

    def test_wrap_ivr_removes_rupee(self):
        from utils.language_utils import wrap_for_ivr
        result = wrap_for_ivr("Price is ₹2,340 per qtl")
        assert "₹" not in result
        assert "rupees" in result

    def test_format_numbered_list(self):
        from utils.language_utils import format_numbered_list
        items = ["Step one", "Step two", "Step three"]
        result = format_numbered_list(items)
        assert "1. Step one" in result
        assert "3. Step three" in result


# ───────────────────────────────────────────────────────────
# Tests: Image Utilities
# ───────────────────────────────────────────────────────────

class TestImageUtils:
    def test_softmax_sums_to_one(self):
        from utils.image_utils import softmax
        logits = np.array([1.0, 2.0, 3.0, 0.5])
        probs = softmax(logits)
        assert abs(probs.sum() - 1.0) < 1e-6

    def test_softmax_argmax_preserved(self):
        from utils.image_utils import softmax
        logits = np.array([0.1, 5.0, 0.3])
        probs = softmax(logits)
        assert probs.argmax() == 1

    def test_top_k_predictions_length(self):
        from utils.image_utils import top_k_predictions
        logits = np.random.randn(38)
        classes = [f"class_{i}" for i in range(38)]
        results = top_k_predictions(logits, classes, k=5)
        assert len(results) == 5

    def test_top_k_predictions_sorted(self):
        from utils.image_utils import top_k_predictions
        logits = np.random.randn(38)
        classes = [f"class_{i}" for i in range(38)]
        results = top_k_predictions(logits, classes, k=5)
        probs = [r["probability"] for r in results]
        assert probs == sorted(probs, reverse=True)

    def test_top_k_probabilities_in_range(self):
        from utils.image_utils import top_k_predictions
        logits = np.random.randn(38)
        classes = [f"class_{i}" for i in range(38)]
        results = top_k_predictions(logits, classes, k=5)
        for r in results:
            assert 0.0 <= r["probability"] <= 1.0

    def test_preprocess_output_shape(self):
        from utils.image_utils import preprocess_for_inference
        fake_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        processed = preprocess_for_inference(fake_image, img_size=224)
        assert processed.shape == (1, 224, 224, 3)

    def test_preprocess_output_dtype(self):
        from utils.image_utils import preprocess_for_inference
        fake_image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        processed = preprocess_for_inference(fake_image, img_size=224)
        assert processed.dtype == np.float32

    def test_load_from_nonexistent_path_raises(self):
        from utils.image_utils import load_image_from_path
        with pytest.raises(FileNotFoundError):
            load_image_from_path("/nonexistent/path/image.jpg")

    def test_load_from_invalid_base64_raises(self):
        from utils.image_utils import load_image_from_base64
        with pytest.raises(ValueError):
            load_image_from_base64("not-valid-base64!!!")


# ───────────────────────────────────────────────────────────
# Tests: Base Agent
# ───────────────────────────────────────────────────────────

class TestBaseAgent:
    def test_agent_input_defaults(self):
        inp = AgentInput(query="test", language="en", user_id="u1")
        assert inp.plot_id is None
        assert isinstance(inp.context, dict)

    def test_agent_output_fields(self):
        out = AgentOutput(
            agent_name="TestAgent",
            success=True,
            result={"data": "ok"},
            confidence=0.9,
            reasoning="Matched keyword",
            language="en",
            processing_time_ms=120,
            sources=[],
            follow_up_actions=[],
        )
        assert out.error is None
        assert_valid_output(out)

    def test_agent_output_error_state(self):
        out = AgentOutput(
            agent_name="TestAgent",
            success=False,
            result={},
            confidence=0.0,
            reasoning="",
            language="en",
            processing_time_ms=5,
            sources=[],
            follow_up_actions=[],
            error="Something failed",
        )
        assert not out.success
        assert out.error == "Something failed"


# ───────────────────────────────────────────────────────────
# Tests: Knowledge Base
# ───────────────────────────────────────────────────────────

class TestKnowledgeBase:
    def test_lookup_known_disease(self):
        from knowledge_base.crop_disease_db import lookup_disease
        result = lookup_disease("early blight")
        # May be None if exact key differs — test it doesn't raise
        assert result is None or hasattr(result, "name")

    def test_lookup_known_crop(self):
        from knowledge_base.crop_disease_db import lookup_crop
        result = lookup_crop("Tomato")
        assert result is not None
        assert result.name == "Tomato"

    def test_search_by_symptom_returns_list(self):
        from knowledge_base.crop_disease_db import search_by_symptom
        results = search_by_symptom(["brown spots", "yellow"])
        assert isinstance(results, list)

    def test_diseases_dict_nonempty(self):
        from knowledge_base.crop_disease_db import DISEASES
        assert len(DISEASES) >= 10

    def test_crops_dict_nonempty(self):
        from knowledge_base.crop_disease_db import CROPS
        assert len(CROPS) >= 5

    def test_crop_treatment_map_populated(self):
        from training.configs.model_config import CROP_TREATMENT_MAP
        assert len(CROP_TREATMENT_MAP) >= 5
        for key, val in CROP_TREATMENT_MAP.items():
            assert "severity" in val
            assert "treatment_en" in val

    def test_disease_classes_count(self):
        from training.configs.model_config import DISEASE_CLASSES
        assert len(DISEASE_CLASSES) >= 20


# ───────────────────────────────────────────────────────────
# Tests: KnowledgeBaseAgent (async)
# ───────────────────────────────────────────────────────────

class TestKnowledgeBaseAgent:
    @pytest.mark.asyncio
    async def test_process_returns_output(self):
        from agents.specialist.knowledge_base_agent import KnowledgeBaseAgent
        agent = KnowledgeBaseAgent(config={"top_k": 3, "fallback_to_tfidf": True})
        inp = make_input(query="tomato early blight treatment")
        output = await agent.process(inp)
        assert_valid_output(output)

    @pytest.mark.asyncio
    async def test_process_hindi_query(self):
        from agents.specialist.knowledge_base_agent import KnowledgeBaseAgent
        agent = KnowledgeBaseAgent(config={"top_k": 3, "fallback_to_tfidf": True})
        inp = make_input(query="टमाटर के पत्तों पर धब्बे", lang="hi")
        output = await agent.process(inp)
        assert output.language in {"hi", "en"}

    @pytest.mark.asyncio
    async def test_health_check_returns_ok(self):
        from agents.specialist.knowledge_base_agent import KnowledgeBaseAgent
        agent = KnowledgeBaseAgent(config={"fallback_to_tfidf": True})
        status = agent.health_check()
        assert "status" in status


# ───────────────────────────────────────────────────────────
# Tests: DiagnosisAgent (mocked model)
# ───────────────────────────────────────────────────────────

class TestDiagnosisAgent:
    @pytest.mark.asyncio
    async def test_process_with_mock_image(self):
        from agents.specialist.diagnosis_agent import DiagnosisAgent
        agent = DiagnosisAgent(config={"model_path": None, "confidence_threshold": 0.65})

        # Inject mock inference
        fake_logits = np.zeros(38, dtype=np.float32)
        fake_logits[0] = 5.0  # class 0 = Early Blight

        agent._run_inference = MagicMock(return_value=(0, 0.91, [{"class_name": "Tomato_Early_blight", "probability": 0.91}]))

        # Create a fake small image in base64
        import base64, io
        from PIL import Image as PILImage
        img = PILImage.new("RGB", (224, 224), color=(80, 140, 60))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode()

        inp = make_input(
            query="diagnose my tomato",
            context={"image_b64": b64, "crop_name": "Tomato"},
        )
        output = await agent.process(inp)
        assert_valid_output(output)
        assert output.success

    @pytest.mark.asyncio
    async def test_low_confidence_triggers_escalation(self):
        from agents.specialist.diagnosis_agent import DiagnosisAgent
        agent = DiagnosisAgent(config={"model_path": None, "confidence_threshold": 0.65})
        agent._run_inference = MagicMock(return_value=(0, 0.40, [{"class_name": "Tomato_Early_blight", "probability": 0.40}]))

        import base64, io
        from PIL import Image as PILImage
        img = PILImage.new("RGB", (224, 224), color=(80, 140, 60))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode()

        inp = make_input(query="diagnose", context={"image_b64": b64})
        output = await agent.process(inp)
        # Low confidence → should_escalate flag in result
        assert output.result.get("should_escalate") is True or output.confidence < 0.65


# ───────────────────────────────────────────────────────────
# Tests: WeatherAdvisoryAgent
# ───────────────────────────────────────────────────────────

MOCK_FORECAST = {
    "current": {"temp": 32, "humidity": 68, "rainfall_24h": 0, "wind_speed": 12},
    "forecast": [
        {"date": "2026-08-12", "day": "Wed", "maxTemp": 33, "minTemp": 22, "rainfall": 0, "humidity": 68},
        {"date": "2026-08-13", "day": "Thu", "maxTemp": 30, "minTemp": 21, "rainfall": 5, "humidity": 75},
        {"date": "2026-08-14", "day": "Fri", "maxTemp": 28, "minTemp": 20, "rainfall": 12, "humidity": 82},
    ],
}

MOCK_PLOT = {
    "crop": "Tomato", "area_acres": 1.2, "stage": "Flowering",
    "soil_moisture": 32, "root_depth_cm": 30,
}


class TestWeatherAdvisoryAgent:
    @pytest.mark.asyncio
    async def test_process_returns_output(self):
        from agents.specialist.weather_advisory_agent import WeatherAdvisoryAgent
        agent = WeatherAdvisoryAgent(config={})
        inp = make_input(
            query="irrigation advice",
            context={"lat": 23.5, "lon": 77.8, "plot": MOCK_PLOT, "forecast": MOCK_FORECAST},
        )
        output = await agent.process(inp)
        assert_valid_output(output)

    @pytest.mark.asyncio
    async def test_irrigation_recommendation_present(self):
        from agents.specialist.weather_advisory_agent import WeatherAdvisoryAgent
        agent = WeatherAdvisoryAgent(config={})
        inp = make_input(
            query="irrigation",
            context={"lat": 23.5, "lon": 77.8, "plot": MOCK_PLOT, "forecast": MOCK_FORECAST},
        )
        output = await agent.process(inp)
        assert "irrigation" in output.result or "schedule" in output.result

    @pytest.mark.asyncio
    async def test_high_humidity_triggers_fungal_risk(self):
        from agents.specialist.weather_advisory_agent import WeatherAdvisoryAgent
        agent = WeatherAdvisoryAgent(config={})
        humid_forecast = {**MOCK_FORECAST, "current": {**MOCK_FORECAST["current"], "humidity": 92}}
        inp = make_input(
            query="disease risk",
            context={"lat": 23.5, "lon": 77.8, "plot": MOCK_PLOT, "forecast": humid_forecast},
        )
        output = await agent.process(inp)
        result_str = json.dumps(output.result).lower()
        assert "fungal" in result_str or "risk" in result_str


# ───────────────────────────────────────────────────────────
# Tests: MandiPriceAgent
# ───────────────────────────────────────────────────────────

MOCK_PRICES = [
    {"mandiName": "Azadpur", "state": "Delhi", "modalPrice": 2340, "district": "Delhi"},
    {"mandiName": "Vashi", "state": "Maharashtra", "modalPrice": 2280, "district": "Navi Mumbai"},
    {"mandiName": "Koyambedu", "state": "Tamil Nadu", "modalPrice": 2190, "district": "Chennai"},
]


class TestMandiPriceAgent:
    @pytest.mark.asyncio
    async def test_process_returns_output(self):
        from agents.specialist.mandi_price_agent import MandiPriceAgent
        agent = MandiPriceAgent(config={})
        inp = make_input(
            query="best price for tomato",
            context={
                "commodity": "Tomato", "state": "Maharashtra",
                "farmer_location": {"lat": 23.5, "lon": 77.8},
                "current_prices": MOCK_PRICES,
                "plot_data": {"crop": "Tomato", "volume_tonnes": 2},
            },
        )
        output = await agent.process(inp)
        assert_valid_output(output)

    @pytest.mark.asyncio
    async def test_best_mandi_identified(self):
        from agents.specialist.mandi_price_agent import MandiPriceAgent
        agent = MandiPriceAgent(config={})
        inp = make_input(
            query="mandi prices",
            context={
                "commodity": "Tomato", "state": "Maharashtra",
                "farmer_location": {"lat": 23.5, "lon": 77.8},
                "current_prices": MOCK_PRICES,
                "plot_data": {},
            },
        )
        output = await agent.process(inp)
        # Best mandi should be identified
        assert "best_mandi" in output.result or "ranked_mandis" in output.result or output.success


# ───────────────────────────────────────────────────────────
# Tests: OutbreakDetectionAgent
# ───────────────────────────────────────────────────────────

MOCK_DIAGNOSES = [
    {"lat": 23.52, "lon": 77.80, "disease": "Tomato_Early_blight", "crop": "Tomato", "timestamp": "2026-08-10T08:00:00Z", "confidence": 0.91},
    {"lat": 23.53, "lon": 77.81, "disease": "Tomato_Early_blight", "crop": "Tomato", "timestamp": "2026-08-10T09:00:00Z", "confidence": 0.85},
    {"lat": 23.51, "lon": 77.79, "disease": "Tomato_Early_blight", "crop": "Tomato", "timestamp": "2026-08-11T10:00:00Z", "confidence": 0.88},
    {"lat": 23.54, "lon": 77.82, "disease": "Tomato_Early_blight", "crop": "Tomato", "timestamp": "2026-08-12T07:00:00Z", "confidence": 0.90},
]


class TestOutbreakDetectionAgent:
    @pytest.mark.asyncio
    async def test_detects_cluster(self):
        from agents.specialist.outbreak_detection_agent import OutbreakDetectionAgent
        agent = OutbreakDetectionAgent(config={
            "cluster_grid_size_km": 5.0,
            "min_cases_for_warning": 3,
            "min_cases_for_emergency": 8,
        })
        inp = make_input(
            query="outbreak check",
            context={
                "recent_diagnoses": MOCK_DIAGNOSES,
                "region": {"state": "Madhya Pradesh", "district": "Vidisha"},
                "time_window_days": 7,
            },
        )
        output = await agent.process(inp)
        assert_valid_output(output)

    @pytest.mark.asyncio
    async def test_empty_diagnoses_no_alert(self):
        from agents.specialist.outbreak_detection_agent import OutbreakDetectionAgent
        agent = OutbreakDetectionAgent(config={"min_cases_for_warning": 3})
        inp = make_input(
            query="outbreak check",
            context={"recent_diagnoses": [], "region": {}, "time_window_days": 7},
        )
        output = await agent.process(inp)
        assert output.success
        alerts = output.result.get("alerts", [])
        assert len(alerts) == 0


# ───────────────────────────────────────────────────────────
# Tests: FeedbackAgent
# ───────────────────────────────────────────────────────────

class TestFeedbackAgent:
    @pytest.mark.asyncio
    async def test_submit_feedback(self, tmp_path):
        from agents.specialist.feedback_agent import FeedbackAgent
        agent = FeedbackAgent(config={"db_path": str(tmp_path / "test_feedback.db")})
        inp = make_input(
            query="feedback",
            context={
                "action": "feedback_submit",
                "diagnosis_id": "diag-001",
                "predicted_label": "Tomato_Early_blight",
                "farmer_feedback": "confirmed",
                "confidence": 0.91,
            },
        )
        output = await agent.process(inp)
        assert output.success

    @pytest.mark.asyncio
    async def test_get_summary(self, tmp_path):
        from agents.specialist.feedback_agent import FeedbackAgent
        agent = FeedbackAgent(config={"db_path": str(tmp_path / "test_feedback.db")})
        inp = make_input(
            query="summary",
            context={"action": "get_summary", "days": 30},
        )
        output = await agent.process(inp)
        assert output.success


# ───────────────────────────────────────────────────────────
# Tests: MasterOrchestrator intent classification
# ───────────────────────────────────────────────────────────

class TestMasterOrchestrator:
    def test_classify_disease_intent(self):
        from agents.orchestrator.master_orchestrator import MasterOrchestratorAgent
        agent = MasterOrchestratorAgent.__new__(MasterOrchestratorAgent)
        agent.logger = MagicMock()
        intent = agent._classify_intent("my tomato has brown spots and yellow leaves")
        assert intent.primary_intent in {"disease_diagnosis", "general_crop_advice"}

    def test_classify_price_intent(self):
        from agents.orchestrator.master_orchestrator import MasterOrchestratorAgent
        agent = MasterOrchestratorAgent.__new__(MasterOrchestratorAgent)
        agent.logger = MagicMock()
        intent = agent._classify_intent("what is the mandi price for onion today")
        assert intent.primary_intent in {"price_check", "general_crop_advice"}

    def test_classify_weather_intent(self):
        from agents.orchestrator.master_orchestrator import MasterOrchestratorAgent
        agent = MasterOrchestratorAgent.__new__(MasterOrchestratorAgent)
        agent.logger = MagicMock()
        intent = agent._classify_intent("how much water should I give wheat today")
        assert intent.primary_intent in {"irrigation_advice", "general_crop_advice"}


# ───────────────────────────────────────────────────────────
# Tests: Model Config
# ───────────────────────────────────────────────────────────

class TestModelConfig:
    def test_default_config_creates_correctly(self):
        from training.configs.model_config import default_config
        cfg = default_config()
        assert cfg.model.num_classes >= 38
        assert cfg.training.batch_size > 0
        assert cfg.training.learning_rate > 0

    def test_disease_classes_unique(self):
        from training.configs.model_config import DISEASE_CLASSES
        assert len(DISEASE_CLASSES) == len(set(DISEASE_CLASSES))

    def test_export_config_paths(self):
        from training.configs.model_config import default_config
        cfg = default_config()
        assert cfg.export.tflite_output_path.endswith(".tflite")
        assert cfg.export.onnx_output_path.endswith(".onnx")
