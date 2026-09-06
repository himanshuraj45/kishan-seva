import logging
import pickle
import uuid
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from pathlib import Path

logger = logging.getLogger(__name__)

@dataclass
class DocumentChunk:
    """Represents a searchable document chunk."""
    id: str
    content: str
    content_hi: str
    metadata: dict
    embedding: Optional[np.ndarray] = None

class VectorStore:
    """Vector store for RAG with TF-IDF fallback."""
    def __init__(self, model_name='sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'):
        self.documents: Dict[str, DocumentChunk] = {}
        self.model_name = model_name
        self.use_fallback = False
        self.model = None
        self.tfidf = None
        self.tfidf_matrix = None
        self._document_order: List[str] = []
        
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
            logger.info(f"Loaded sentence transformer: {model_name}")
        except ImportError:
            logger.warning("sentence-transformers not installed. Using TF-IDF fallback.")
            self.use_fallback = True
            from sklearn.feature_extraction.text import TfidfVectorizer
            self.tfidf = TfidfVectorizer(stop_words='english')

    def add_document(self, content: str, content_hi: str, metadata: dict) -> str:
        """Add a single document to the store."""
        chunk_id = str(uuid.uuid4())
        doc = DocumentChunk(
            id=chunk_id,
            content=content,
            content_hi=content_hi,
            metadata=metadata
        )
        self.documents[chunk_id] = doc
        self._document_order.append(chunk_id)
        
        if not self.use_fallback:
            doc.embedding = self._embed([content])[0]
        else:
            self._rebuild_tfidf()
            
        return chunk_id

    def add_documents_batch(self, docs: List[dict]) -> List[str]:
        """Add multiple documents efficiently."""
        ids = []
        texts = []
        
        for doc_data in docs:
            chunk_id = str(uuid.uuid4())
            ids.append(chunk_id)
            doc = DocumentChunk(
                id=chunk_id,
                content=doc_data.get('content', ''),
                content_hi=doc_data.get('content_hi', ''),
                metadata=doc_data.get('metadata', {})
            )
            self.documents[chunk_id] = doc
            self._document_order.append(chunk_id)
            texts.append(doc.content)
            
        if not self.use_fallback:
            embeddings = self._embed(texts)
            for chunk_id, emb in zip(ids, embeddings):
                self.documents[chunk_id].embedding = emb
        else:
            self._rebuild_tfidf()
            
        return ids

    def _rebuild_tfidf(self):
        """Rebuild TF-IDF matrix for fallback mode."""
        if not self.documents:
            return
        texts = [self.documents[doc_id].content for doc_id in self._document_order]
        self.tfidf_matrix = self.tfidf.fit_transform(texts)

    def search(self, query: str, top_k=5, language='en') -> List[DocumentChunk]:
        """Search the vector store."""
        if not self.documents:
            return []
            
        if self.use_fallback:
            query_vec = self.tfidf.transform([query])
            from sklearn.metrics.pairwise import cosine_similarity
            similarities = cosine_similarity(query_vec, self.tfidf_matrix)[0]
            indices = np.argsort(similarities)[::-1][:top_k]
            
            results = []
            for idx in indices:
                if similarities[idx] > 0.05:  # simple threshold
                    doc_id = self._document_order[idx]
                    results.append(self.documents[doc_id])
            return results
        else:
            query_emb = self._embed([query])[0]
            
            scores = []
            for doc_id, doc in self.documents.items():
                if doc.embedding is not None:
                    score = self._cosine_similarity(query_emb, doc.embedding)
                    scores.append((score, doc))
            
            scores.sort(key=lambda x: x[0], reverse=True)
            return [doc for score, doc in scores[:top_k] if score > 0.3]

    def save(self, path: Path):
        """Save vector store to disk."""
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'wb') as f:
            pickle.dump({
                'documents': self.documents,
                '_document_order': self._document_order,
                'use_fallback': self.use_fallback,
                'tfidf': self.tfidf,
                'tfidf_matrix': self.tfidf_matrix
            }, f)

    @classmethod
    def load(cls, path: Path) -> 'VectorStore':
        """Load vector store from disk."""
        store = cls()
        with open(path, 'rb') as f:
            data = pickle.load(f)
            store.documents = data['documents']
            store._document_order = data['_document_order']
            store.use_fallback = data['use_fallback']
            store.tfidf = data.get('tfidf')
            store.tfidf_matrix = data.get('tfidf_matrix')
        return store

    def _embed(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings using the model."""
        if self.model:
            return self.model.encode(texts)
        return np.zeros((len(texts), 384))  # Dummy fallback

    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity."""
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))


def build_knowledge_base(db_module) -> VectorStore:
    """Builds the vector index from crop disease DB."""
    store = VectorStore()
    docs = []
    
    for disease_id, disease in db_module.DISEASES.items():
        content = f"Disease: {disease.name} affects {disease.crop}. Symptoms: {', '.join(disease.symptoms)}. Treatments: {', '.join(disease.treatment_steps)}. Prevention: {', '.join(disease.prevention_tips)}"
        docs.append({
            'content': content,
            'content_hi': disease.description_hi,
            'metadata': {
                'type': 'disease',
                'name': disease.name,
                'crop': disease.crop,
                'category': disease.category
            }
        })
    
    if docs:
        store.add_documents_batch(docs)
    return store
