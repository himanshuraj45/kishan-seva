import abc
import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class AgentInput:
    """Input payload for an agent."""
    query: str
    language: str
    user_id: str
    plot_id: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

@dataclass
class AgentOutput:
    """Output payload from an agent."""
    agent_name: str
    success: bool
    result: Dict[str, Any]
    confidence: float
    reasoning: str
    language: str
    processing_time_ms: int
    sources: List[str] = field(default_factory=list)
    follow_up_actions: List[str] = field(default_factory=list)
    error: Optional[str] = None

class BaseAgent(abc.ABC):
    """Abstract base class for all ML agents in KisanSeva."""
    
    def __init__(self, config: dict = None):
        self.config = config or {}
        # Set up metrics tracking
        self.metrics = {
            "invocations": 0,
            "successes": 0,
            "total_time_ms": 0,
        }
        logger.info(f"Initialized agent: {self.name}")

    @property
    @abc.abstractmethod
    def name(self) -> str:
        """Agent's identifier name."""
        pass

    @property
    @abc.abstractmethod
    def description(self) -> str:
        """Agent's purpose description."""
        pass

    @abc.abstractmethod
    async def process(self, input: AgentInput) -> AgentOutput:
        """Process the input and generate an output."""
        pass

    def _translate(self, text: str, target_lang: str) -> str:
        """Simple fallback translator. Should be overridden by real MT system."""
        if target_lang == 'en' or not text:
            return text
        # Mock translation for prototype
        return f"[Translated to {target_lang}]: {text}"

    def _log_metrics(self, output: AgentOutput):
        """Log performance metrics."""
        self.metrics["invocations"] += 1
        if output.success:
            self.metrics["successes"] += 1
        self.metrics["total_time_ms"] += output.processing_time_ms
        
        avg_time = self.metrics["total_time_ms"] / self.metrics["invocations"]
        success_rate = self.metrics["successes"] / self.metrics["invocations"]
        
        logger.debug(
            f"Agent {self.name} metrics: "
            f"Avg Time={avg_time:.2f}ms, "
            f"Success Rate={success_rate*100:.1f}%"
        )

    def _validate_input(self, input: AgentInput) -> bool:
        """Basic validation of the input payload."""
        if not input.query or not input.user_id:
            return False
        if input.language not in ['en', 'hi', 'ta', 'te', 'kn', 'bn']:
            # Default to en or reject? We'll log warning
            logger.warning(f"Unsupported language: {input.language}")
        return True

    @staticmethod
    def with_retry(max_retries=3, delay=1.0):
        """Decorator for retry logic on transient failures."""
        def decorator(func):
            async def wrapper(self, *args, **kwargs):
                retries = 0
                while retries < max_retries:
                    try:
                        return await func(self, *args, **kwargs)
                    except Exception as e:
                        retries += 1
                        logger.error(f"Error in {func.__name__} (attempt {retries}/{max_retries}): {e}")
                        if retries == max_retries:
                            raise e
                        await asyncio.sleep(delay * (2 ** (retries - 1)))  # Exponential backoff
            return wrapper
        return decorator

    def health_check(self) -> dict:
        """Return agent health status."""
        return {
            "name": self.name,
            "status": "healthy",
            "metrics": self.metrics
        }
