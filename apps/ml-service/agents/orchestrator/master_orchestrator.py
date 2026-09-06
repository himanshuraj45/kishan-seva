import asyncio
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from pathlib import Path

try:
    from agents.base import BaseAgent, AgentInput, AgentOutput
except ImportError:
    class BaseAgent:
        def __init__(self, config=None):
            self.config = config or {}
        async def process(self, input_data: 'AgentInput') -> 'AgentOutput':
            raise NotImplementedError
        async def health_check(self) -> Dict[str, Any]:
            return {"status": "healthy"}

    @dataclass
    class AgentInput:
        query: str
        language: str = "en"
        user_id: Optional[str] = None
        context: dict = field(default_factory=dict)
        data: Any = None

    @dataclass
    class AgentOutput:
        status: str
        data: dict
        message: str
        confidence: float = 1.0


logger = logging.getLogger(__name__)


@dataclass
class IntentClassification:
    """Dataclass holding intent classification results."""
    primary_intent: str
    secondary_intents: List[str]
    requires_image: bool
    requires_location: bool
    confidence: float


@dataclass
class AgentTask:
    """Dataclass holding a task to be executed by a sub-agent."""
    agent_name: str
    input_override: Optional[dict] = None
    priority: int = 1


class MasterOrchestratorAgent(BaseAgent):
    """
    MasterOrchestratorAgent routes queries and aggregates sub-agent results.
    """
    @property
    def name(self) -> str:
        return "MasterOrchestratorAgent"

    @property
    def description(self) -> str:
        return "Routes queries and aggregates sub-agent results."

    def __init__(self, config: Optional[dict] = None):
        super().__init__(config)
        self.config = config or {}
        self.sub_agents = {}
        # The registry will inject the actual agents, but we define them here
        # Sub-agents to be initialized from registry:
        # DiagnosisAgent, WeatherAdvisoryAgent, MandiPriceAgent, 
        # SoilHealthAgent, OutbreakDetectionAgent, KnowledgeBaseAgent, SMSIVRAgent
    
    def set_sub_agents(self, agents: Dict[str, BaseAgent]):
        """Inject sub-agents into the orchestrator."""
        self.sub_agents = agents

    def _classify_intent(self, query: str) -> IntentClassification:
        """
        Classify intent using a keyword-based ruleset.
        """
        query_lower = query.lower()
        intents = set()
        requires_image = False
        requires_location = False
        
        # Keyword mappings
        if any(w in query_lower for w in ['disease', 'rog', 'bimari', 'sick', 'spot']):
            intents.add('disease_diagnosis')
            requires_image = True
        if any(w in query_lower for w in ['paani', 'irrigation', 'water', 'weather', 'mausam', 'rain']):
            intents.add('weather_query')
            requires_location = True
        if any(w in query_lower for w in ['bhav', 'mandi', 'price', 'rate', 'market']):
            intents.add('price_check')
            requires_location = True
        if any(w in query_lower for w in ['khad', 'fertilizer', 'urea', 'soil', 'mitti']):
            intents.add('fertilizer_advice')
            requires_location = True
        if any(w in query_lower for w in ['pest', 'kida']):
            intents.add('pest_info')
            
        primary = 'general_crop_advice'
        if intents:
            primary = list(intents)[0]
            
        secondary = list(intents)[1:] if len(intents) > 1 else []
        
        return IntentClassification(
            primary_intent=primary,
            secondary_intents=secondary,
            requires_image=requires_image,
            requires_location=requires_location,
            confidence=0.85 if intents else 0.5
        )

    def _build_agent_tasks(self, intent: IntentClassification, input_data: AgentInput) -> List[AgentTask]:
        """
        Build a list of tasks for the sub-agents based on the classified intent.
        """
        tasks = []
        all_intents = [intent.primary_intent] + intent.secondary_intents
        
        for i in all_intents:
            if i in ['disease_diagnosis', 'pest_info']:
                tasks.append(AgentTask(agent_name="DiagnosisAgent", priority=1))
            elif i == 'weather_query':
                tasks.append(AgentTask(agent_name="WeatherAdvisoryAgent", priority=2))
            elif i == 'price_check':
                tasks.append(AgentTask(agent_name="MandiPriceAgent", priority=2))
            elif i == 'fertilizer_advice':
                tasks.append(AgentTask(agent_name="SoilHealthAgent", priority=2))
            elif i == 'outbreak_report':
                tasks.append(AgentTask(agent_name="OutbreakDetectionAgent", priority=3))
                
        # If no specific tasks, fallback to KnowledgeBase
        if not tasks or intent.primary_intent in ['general_crop_advice', 'help']:
            tasks.append(AgentTask(agent_name="KnowledgeBaseAgent", priority=5))
            
        return tasks

    async def _run_agents_parallel(self, tasks: List[AgentTask], original_input: AgentInput) -> Dict[str, AgentOutput]:
        """
        Run multiple sub-agents in parallel and gather their results.
        """
        results = {}
        async def run_task(task: AgentTask):
            agent = self.sub_agents.get(task.agent_name)
            if not agent:
                logger.warning(f"Agent {task.agent_name} not found.")
                return task.agent_name, None
            
            task_input = AgentInput(
                query=original_input.query,
                language=original_input.language,
                user_id=original_input.user_id,
                context=task.input_override or original_input.context,
                data=original_input.data
            )
            try:
                result = await agent.process(task_input)
                return task.agent_name, result
            except Exception as e:
                logger.error(f"Error running agent {task.agent_name}: {e}")
                return task.agent_name, None

        coroutines = [run_task(task) for task in tasks]
        gathered = await asyncio.gather(*coroutines)
        
        for name, res in gathered:
            if res:
                results[name] = res
                
        return results

    def _aggregate_results(self, results: Dict[str, AgentOutput], intent: IntentClassification) -> dict:
        """
        Combine multiple agent outputs into a unified response dict.
        """
        combined = {
            "intents_handled": [intent.primary_intent] + intent.secondary_intents,
            "sections": {}
        }
        
        if "DiagnosisAgent" in results:
            combined["sections"]["diagnosis"] = results["DiagnosisAgent"].data
        if "WeatherAdvisoryAgent" in results:
            combined["sections"]["weather"] = results["WeatherAdvisoryAgent"].data
        if "MandiPriceAgent" in results:
            combined["sections"]["market"] = results["MandiPriceAgent"].data
        if "SoilHealthAgent" in results:
            combined["sections"]["soil"] = results["SoilHealthAgent"].data
        if "KnowledgeBaseAgent" in results:
            combined["sections"]["general"] = results["KnowledgeBaseAgent"].data
            
        return combined

    def _generate_final_response(self, combined: dict, lang: str) -> str:
        """
        Format the aggregated results into a single final text advisory.
        """
        parts = []
        if "diagnosis" in combined["sections"]:
            parts.append(f"Diagnosis: {combined['sections']['diagnosis'].get('disease', 'Unknown')}")
        if "weather" in combined["sections"]:
            parts.append(f"Weather: {combined['sections']['weather'].get('forecast', 'N/A')}")
        if "market" in combined["sections"]:
            parts.append(f"Market Price: {combined['sections']['market'].get('price', 'N/A')}")
        if "general" in combined["sections"]:
            parts.append(f"Info: {combined['sections']['general'].get('answer', '')}")
            
        if not parts:
            return "We could not find specific information for your query. Please contact the expert helpdesk."
            
        return "\n\n".join(parts)

    async def process(self, input_data: AgentInput) -> AgentOutput:
        """
        Main entry point for MasterOrchestrator.
        """
        intent = self._classify_intent(input_data.query)
        tasks = self._build_agent_tasks(intent, input_data)
        
        results = await self._run_agents_parallel(tasks, input_data)
        
        # Fallback to KB if everything failed
        if not results and "KnowledgeBaseAgent" in self.sub_agents:
            kb = self.sub_agents["KnowledgeBaseAgent"]
            kb_res = await kb.process(input_data)
            results["KnowledgeBaseAgent"] = kb_res
            
        combined = self._aggregate_results(results, intent)
        final_text = self._generate_final_response(combined, input_data.language)
        
        return AgentOutput(
            status="success",
            data=combined,
            message=final_text,
            confidence=intent.confidence
        )

    async def health_check(self) -> Dict[str, Any]:
        """
        Pings all sub-agents and returns aggregate status.
        """
        statuses = {}
        for name, agent in self.sub_agents.items():
            try:
                res = await agent.health_check()
                statuses[name] = res
            except Exception as e:
                statuses[name] = {"status": "error", "message": str(e)}
                
        return {
            "status": "healthy",
            "sub_agents": statuses
        }
