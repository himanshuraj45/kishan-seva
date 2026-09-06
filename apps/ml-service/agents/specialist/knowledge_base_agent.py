import time
import logging
from typing import Any, Dict, List
from pathlib import Path

from agents.base.base_agent import BaseAgent, AgentInput, AgentOutput
from knowledge_base import crop_disease_db
from knowledge_base.vector_store import VectorStore, build_knowledge_base

logger = logging.getLogger(__name__)

class KnowledgeBaseAgent(BaseAgent):
    """Agent for querying the crop/disease knowledge base."""
    
    def __init__(self, config: dict = None):
        super().__init__(config)
        self.db = crop_disease_db
        # Initialize RAG vector store
        try:
            self.vector_store = build_knowledge_base(self.db)
            logger.info("Knowledge base vector store built successfully.")
        except Exception as e:
            logger.error(f"Failed to build vector store: {e}")
            self.vector_store = None

    @property
    def name(self) -> str:
        return "KnowledgeBaseAgent"

    @property
    def description(self) -> str:
        return "Answers questions about crops, diseases, pests, and treatments."

    @BaseAgent.with_retry(max_retries=2, delay=1.0)
    async def process(self, input: AgentInput) -> AgentOutput:
        start_time = time.time()
        
        if not self._validate_input(input):
            return AgentOutput(
                agent_name=self.name, success=False, result={},
                confidence=0.0, reasoning="Invalid input payload.",
                language=input.language, processing_time_ms=0,
                error="Validation failed"
            )

        intent = self._search_intent(input.query)
        sources = []
        result_data = {}
        confidence = 0.5
        reasoning = f"Determined intent as {intent}. "
        
        # 1. Exact lookup first
        disease = self.db.lookup_disease(input.query)
        
        # 2. Vector search if exact match fails
        if not disease and self.vector_store:
            search_results = self.vector_store.search(input.query, top_k=2)
            if search_results:
                best_match = search_results[0]
                confidence = 0.8
                sources.append(f"VectorStore Chunk {best_match.id}")
                
                meta = best_match.metadata
                if meta.get('type') == 'disease':
                    disease = self.db.lookup_disease(meta.get('name', ''))
        
        # 3. Symptom keyword search fallback
        if not disease:
            keywords = input.query.split()
            symptom_matches = self.db.search_by_symptom(keywords)
            if symptom_matches:
                disease = symptom_matches[0]
                confidence = 0.6
                sources.append("Symptom Keyword Search")

        if disease:
            result_data = self._format_disease_response(disease, input.language)
            reasoning += f"Found matching disease: {disease.name}."
            success = True
        else:
            result_data = {"message": self._translate("I could not find specific information for your query.", input.language)}
            reasoning += "No strong matches found."
            success = False
            confidence = 0.1

        processing_time_ms = int((time.time() - start_time) * 1000)
        
        output = AgentOutput(
            agent_name=self.name,
            success=success,
            result=result_data,
            confidence=confidence,
            reasoning=reasoning,
            language=input.language,
            processing_time_ms=processing_time_ms,
            sources=sources,
            follow_up_actions=["ask_expert"] if not success else ["check_weather"]
        )
        self._log_metrics(output)
        return output

    def _search_intent(self, query: str) -> str:
        """Simple keyword-based intent classifier."""
        q_lower = query.lower()
        if any(word in q_lower for word in ['treat', 'cure', 'medicine', 'spray']):
            return 'treatment_query'
        if any(word in q_lower for word in ['prevent', 'avoid', 'stop']):
            return 'prevention_query'
        if any(word in q_lower for word in ['symptom', 'look like', 'spot', 'rot']):
            return 'symptom_search'
        return 'general_lookup'

    def _format_disease_response(self, disease, lang: str) -> dict:
        """Format the full treatment card for a disease."""
        # Use localized fields if available
        name = disease.name_hi if lang == 'hi' else disease.name
        desc = disease.description_hi if lang == 'hi' else disease.description
        symp = disease.symptoms_hi if lang == 'hi' else disease.symptoms
        treat = disease.treatment_steps_hi if lang == 'hi' else disease.treatment_steps
        
        return {
            "disease_name": name,
            "crop": disease.crop,
            "category": disease.category,
            "description": desc,
            "symptoms": symp,
            "treatment_formatted": self._format_treatment_steps(treat, lang),
            "organic_options": disease.organic_alternatives,
            "chemical_options": disease.chemical_products,
            "recovery_days": disease.recovery_days_estimate
        }

    def _format_treatment_steps(self, steps: List[str], lang: str) -> str:
        """Format steps as a numbered list."""
        if not steps:
            return self._translate("No specific treatments found.", lang)
        
        formatted = ""
        for i, step in enumerate(steps, 1):
            formatted += f"{i}. {step}\n"
        return formatted.strip()

    def update_index(self, new_entries: List[dict]):
        """Adds new documents to vector store."""
        if self.vector_store:
            self.vector_store.add_documents_batch(new_entries)
            logger.info(f"Added {len(new_entries)} new entries to vector index.")
