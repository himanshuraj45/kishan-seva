import json
import logging
from dataclasses import dataclass, field
from typing import Dict, Optional, Any
from pathlib import Path

try:
    from agents.base import BaseAgent
except ImportError:
    class BaseAgent:
        def __init__(self, config=None):
            self.config = config or {}
        async def process(self, input_data):
            raise NotImplementedError
        async def health_check(self):
            return {"status": "healthy"}

logger = logging.getLogger(__name__)


@dataclass
class AgentConfig:
    diagnosis: dict = field(default_factory=dict)
    weather: dict = field(default_factory=dict)
    market: dict = field(default_factory=dict)
    soil: dict = field(default_factory=dict)
    outbreak: dict = field(default_factory=dict)
    knowledge_base: dict = field(default_factory=dict)
    sms: dict = field(default_factory=dict)
    orchestrator: dict = field(default_factory=dict)


def default_config() -> AgentConfig:
    return AgentConfig()


def load_config(path: Path) -> AgentConfig:
    if not path.exists():
        logger.warning(f"Config file {path} not found. Using defaults.")
        return default_config()
        
    with open(path, 'r') as f:
        data = json.load(f)
        
    return AgentConfig(
        diagnosis=data.get('diagnosis', {}),
        weather=data.get('weather', {}),
        market=data.get('market', {}),
        soil=data.get('soil', {}),
        outbreak=data.get('outbreak', {}),
        knowledge_base=data.get('knowledge_base', {}),
        sms=data.get('sms', {}),
        orchestrator=data.get('orchestrator', {})
    )


class AgentRegistry:
    """
    Registry for managing agent instances and dependency injection.
    """
    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}

    def register(self, name: str, agent: BaseAgent, dependencies: Optional[list] = None):
        """Register an agent instance."""
        self._agents[name] = agent
        logger.info(f"Registered agent: {name}")

    def get(self, name: str) -> BaseAgent:
        """Retrieve an agent by name."""
        if name not in self._agents:
            raise KeyError(f"Agent {name} not found in registry.")
        return self._agents[name]

    def get_all(self) -> Dict[str, BaseAgent]:
        """Get all registered agents."""
        return self._agents

    async def health_check_all(self) -> Dict[str, dict]:
        """Run health check on all registered agents."""
        results = {}
        for name, agent in self._agents.items():
            try:
                results[name] = await agent.health_check()
            except Exception as e:
                results[name] = {"status": "error", "message": str(e)}
        return results

    @classmethod
    def initialize_all(cls, config: AgentConfig) -> 'AgentRegistry':
        """
        Factory method to build all agents in dependency order.
        """
        registry = cls()
        
        # In a real scenario, we would import the actual agent classes here.
        # For the scope of this implementation, we will use placeholders for the missing ones,
        # and import the ones we've created.
        try:
            from agents.specialist.sms_ivr_agent import SMSIVRAgent
            registry.register("SMSIVRAgent", SMSIVRAgent(config.sms))
        except ImportError:
            pass
            
        try:
            from agents.specialist.feedback_agent import FeedbackAgent
            registry.register("FeedbackAgent", FeedbackAgent())
        except ImportError:
            pass

        # Placeholder specialist agents
        class PlaceholderAgent(BaseAgent):
            @property
            def name(self) -> str: return "PlaceholderAgent"
            @property
            def description(self) -> str: return "Placeholder"
            async def process(self, input_data): return None
            
        registry.register("DiagnosisAgent", PlaceholderAgent(config.diagnosis))
        registry.register("WeatherAdvisoryAgent", PlaceholderAgent(config.weather))
        registry.register("MandiPriceAgent", PlaceholderAgent(config.market))
        registry.register("SoilHealthAgent", PlaceholderAgent(config.soil))
        registry.register("OutbreakDetectionAgent", PlaceholderAgent(config.outbreak))
        registry.register("KnowledgeBaseAgent", PlaceholderAgent(config.knowledge_base))

        # Finally initialize the orchestrator
        try:
            from agents.orchestrator.master_orchestrator import MasterOrchestratorAgent
            orchestrator = MasterOrchestratorAgent(config.orchestrator)
            
            # Inject dependencies (sub-agents)
            orchestrator.set_sub_agents({
                "DiagnosisAgent": registry.get("DiagnosisAgent"),
                "WeatherAdvisoryAgent": registry.get("WeatherAdvisoryAgent"),
                "MandiPriceAgent": registry.get("MandiPriceAgent"),
                "SoilHealthAgent": registry.get("SoilHealthAgent"),
                "OutbreakDetectionAgent": registry.get("OutbreakDetectionAgent"),
                "KnowledgeBaseAgent": registry.get("KnowledgeBaseAgent"),
                "SMSIVRAgent": registry.get("SMSIVRAgent") if "SMSIVRAgent" in registry.get_all() else None
            })
            registry.register("MasterOrchestratorAgent", orchestrator)
        except ImportError:
            pass

        return registry
