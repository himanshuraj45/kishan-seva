import sqlite3
import time
import json
import uuid
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
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
class FeedbackRecord:
    id: str
    diagnosis_id: str
    image_path: str
    true_label: str
    predicted_label: str
    confidence: float
    farmer_feedback: str  # 'confirmed', 'rejected', 'partially_correct'
    timestamp: float
    used_for_retraining: bool


@dataclass
class RetrainingJob:
    id: str
    triggered_at: float
    trigger_reason: str
    num_samples: int
    status: str  # 'pending', 'running', 'completed', 'failed'
    metrics_before: dict
    metrics_after: dict


@dataclass
class DriftMetrics:
    accuracy_trend: List[float]
    rejection_rate_7day: float
    rejection_rate_30day: float
    top_misclassified_diseases: List[str]
    drift_detected: bool


class FeedbackStore:
    def __init__(self, db_path: str = "feedback.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS feedback (
                    id TEXT PRIMARY KEY,
                    diagnosis_id TEXT,
                    image_path TEXT,
                    true_label TEXT,
                    predicted_label TEXT,
                    confidence REAL,
                    farmer_feedback TEXT,
                    timestamp REAL,
                    used_for_retraining INTEGER
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS retraining_jobs (
                    id TEXT PRIMARY KEY,
                    triggered_at REAL,
                    trigger_reason TEXT,
                    num_samples INTEGER,
                    status TEXT,
                    metrics_before TEXT,
                    metrics_after TEXT
                )
            ''')
            conn.commit()

    def add_feedback(self, record: FeedbackRecord) -> str:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO feedback VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                record.id, record.diagnosis_id, record.image_path, record.true_label,
                record.predicted_label, record.confidence, record.farmer_feedback,
                record.timestamp, int(record.used_for_retraining)
            ))
            conn.commit()
        return record.id

    def get_pending_retraining_samples(self, min_samples: int = 50) -> List[FeedbackRecord]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute('''
                SELECT * FROM feedback WHERE used_for_retraining = 0
            ''').fetchall()
            
            if len(rows) < min_samples:
                return []
                
            records = []
            for r in rows:
                records.append(FeedbackRecord(
                    id=r['id'], diagnosis_id=r['diagnosis_id'], image_path=r['image_path'],
                    true_label=r['true_label'], predicted_label=r['predicted_label'],
                    confidence=r['confidence'], farmer_feedback=r['farmer_feedback'],
                    timestamp=r['timestamp'], used_for_retraining=bool(r['used_for_retraining'])
                ))
            return records

    def mark_used_for_retraining(self, ids: List[str]):
        if not ids:
            return
        with sqlite3.connect(self.db_path) as conn:
            placeholders = ','.join('?' for _ in ids)
            conn.execute(f'''
                UPDATE feedback SET used_for_retraining = 1 WHERE id IN ({placeholders})
            ''', ids)
            conn.commit()

    def get_model_drift_metrics(self) -> DriftMetrics:
        now = time.time()
        day_7 = now - (7 * 86400)
        day_30 = now - (30 * 86400)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            # Rejection rates
            total_7 = conn.execute('SELECT COUNT(*) as c FROM feedback WHERE timestamp > ?', (day_7,)).fetchone()['c']
            rejected_7 = conn.execute("SELECT COUNT(*) as c FROM feedback WHERE timestamp > ? AND farmer_feedback = 'rejected'", (day_7,)).fetchone()['c']
            rr_7 = (rejected_7 / total_7) if total_7 > 0 else 0.0
            
            total_30 = conn.execute('SELECT COUNT(*) as c FROM feedback WHERE timestamp > ?', (day_30,)).fetchone()['c']
            rejected_30 = conn.execute("SELECT COUNT(*) as c FROM feedback WHERE timestamp > ? AND farmer_feedback = 'rejected'", (day_30,)).fetchone()['c']
            rr_30 = (rejected_30 / total_30) if total_30 > 0 else 0.0
            
            # Top misclassified
            misclass = conn.execute('''
                SELECT true_label, COUNT(*) as c FROM feedback 
                WHERE farmer_feedback = 'rejected' AND timestamp > ?
                GROUP BY true_label ORDER BY c DESC LIMIT 3
            ''', (day_30,)).fetchall()
            top_misclassified = [m['true_label'] for m in misclass if m['true_label']]

        return DriftMetrics(
            accuracy_trend=[1.0 - rr_30, 1.0 - rr_7],
            rejection_rate_7day=rr_7,
            rejection_rate_30day=rr_30,
            top_misclassified_diseases=top_misclassified,
            drift_detected=(rr_7 > 0.15)
        )

    def get_feedback_summary(self, days: int = 30) -> dict:
        threshold = time.time() - (days * 86400)
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            total = conn.execute('SELECT COUNT(*) as c FROM feedback WHERE timestamp > ?', (threshold,)).fetchone()['c']
            return {"total_feedback": total, "days": days}


class FeedbackAgent(BaseAgent):
    """
    FeedbackAgent manages the model improvement loop and drift detection.
    """
    @property
    def name(self) -> str:
        return "FeedbackAgent"

    @property
    def description(self) -> str:
        return "Manages the model improvement loop and drift detection."

    def __init__(self, config: Optional[dict] = None):
        super().__init__(config)
        db_path = self.config.get('db_path', 'feedback.db')
        self.store = FeedbackStore(db_path)

    async def process(self, input_data: AgentInput) -> AgentOutput:
        action = input_data.context.get('action')
        
        if action == 'feedback_submit':
            data = input_data.data or {}
            record = FeedbackRecord(
                id=str(uuid.uuid4()),
                diagnosis_id=data.get('diagnosis_id', ''),
                image_path=data.get('image_path', ''),
                true_label=data.get('true_label_if_known', ''),
                predicted_label=data.get('predicted_label', ''),
                confidence=data.get('confidence', 0.0),
                farmer_feedback=data.get('feedback', 'confirmed'),
                timestamp=time.time(),
                used_for_retraining=False
            )
            self.store.add_feedback(record)
            return AgentOutput(status="success", data={"id": record.id}, message="Feedback saved")
            
        elif action == 'get_drift_report':
            metrics = self.store.get_model_drift_metrics()
            return AgentOutput(status="success", data=metrics.__dict__, message="Drift report generated")
            
        elif action == 'trigger_retraining':
            samples = self.store.get_pending_retraining_samples(min_samples=1)
            if samples:
                self._queue_retraining_job(samples)
                return AgentOutput(status="success", data={"queued": len(samples)}, message="Retraining queued")
            return AgentOutput(status="success", data={"queued": 0}, message="No samples for retraining")
            
        elif action == 'get_summary':
            summary = self.store.get_feedback_summary()
            return AgentOutput(status="success", data=summary, message="Summary retrieved")
            
        return AgentOutput(status="error", data={}, message="Unknown action")

    def _check_retraining_trigger(self) -> bool:
        """Called periodically (e.g., via background task)."""
        metrics = self.store.get_model_drift_metrics()
        samples = self.store.get_pending_retraining_samples(min_samples=50)
        
        if metrics.drift_detected or len(samples) >= 50:
            self._send_drift_alert(metrics)
            self._queue_retraining_job(samples)
            return True
        return False

    def _queue_retraining_job(self, samples: List[FeedbackRecord]):
        """Writes job to a queue file for an external training script."""
        if not samples:
            return
            
        job_id = str(uuid.uuid4())
        job_file = Path(f"retrain_job_{job_id}.json")
        job_data = {
            "job_id": job_id,
            "sample_ids": [s.id for s in samples],
            "timestamp": time.time()
        }
        with open(job_file, 'w') as f:
            json.dump(job_data, f)
            
        self.store.mark_used_for_retraining([s.id for s in samples])
        logger.info(f"Queued retraining job {job_id} with {len(samples)} samples.")

    def _compute_class_drift(self, records: List[FeedbackRecord]) -> dict:
        """Compute per-class drift scores."""
        scores = {}
        for r in records:
            if r.predicted_label not in scores:
                scores[r.predicted_label] = {'total': 0, 'rejected': 0}
            scores[r.predicted_label]['total'] += 1
            if r.farmer_feedback == 'rejected':
                scores[r.predicted_label]['rejected'] += 1
                
        result = {}
        for label, stats in scores.items():
            result[label] = stats['rejected'] / stats['total'] if stats['total'] > 0 else 0.0
        return result

    def _send_drift_alert(self, metrics: DriftMetrics):
        """Simulate sending an alert."""
        logger.warning(f"DRIFT ALERT: Detected model drift! Rejection rate: {metrics.rejection_rate_7day:.2f}")
