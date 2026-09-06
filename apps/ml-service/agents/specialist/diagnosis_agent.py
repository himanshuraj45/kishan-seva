import asyncio
import base64
import io
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image

try:
    import onnxruntime as ort
except ImportError:
    ort = None

try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    tflite = None


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
class DiseaseInfo:
    """Information about a detected disease."""
    disease_name: str
    class_idx: int
    severity: str = "unknown"
    should_escalate: bool = False


class BaseAgent:
    """Base class for all agents."""
    async def process(self, input: AgentInput) -> AgentOutput:
        raise NotImplementedError


class DiagnosisAgent(BaseAgent):
    """
    Agent responsible for diagnosing crop diseases from images.
    
    Attributes:
        ESCALATION_THRESHOLD (float): Confidence below which human review is requested.
        CRITICAL_DISEASES (List[str]): Diseases that always require escalation.
        model_path (Path): Path to the ONNX model.
        tflite_model_path (Path): Path to the TFLite model.
    """
    
    ESCALATION_THRESHOLD = 0.65
    CRITICAL_DISEASES = ["late_blight", "fall_armyworm", "locust_swarm"]
    
    def __init__(
        self, 
        model_path: str = "models/disease_classifier.onnx", 
        tflite_model_path: str = "models/disease_classifier.tflite",
        vector_store_path: str = "models/vector_store",
        crop_treatment_map: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Initializes the DiagnosisAgent.
        
        Args:
            model_path: Path to the ONNX model.
            tflite_model_path: Path to the TFLite model.
            vector_store_path: Path to the RAG vector store.
            crop_treatment_map: Optional pre-loaded mapping of crops to treatments.
        """
        self.model_path = Path(model_path)
        self.tflite_model_path = Path(tflite_model_path)
        self.vector_store_path = Path(vector_store_path)
        self.crop_treatment_map = crop_treatment_map or {}
        
        self.ort_session = None
        self.tflite_interpreter = None
        
        self._load_models()
        self._load_vector_store()
        
    def _load_models(self) -> None:
        """Loads the ONNX model or TFLite fallback."""
        if ort is not None and self.model_path.exists():
            try:
                self.ort_session = ort.InferenceSession(str(self.model_path))
                logger.info(f"Loaded ONNX model from {self.model_path}")
            except Exception as e:
                logger.error(f"Failed to load ONNX model: {e}")
        
        if self.ort_session is None and tflite is not None and self.tflite_model_path.exists():
            try:
                self.tflite_interpreter = tflite.Interpreter(model_path=str(self.tflite_model_path))
                self.tflite_interpreter.allocate_tensors()
                logger.info(f"Loaded TFLite model from {self.tflite_model_path}")
            except Exception as e:
                logger.error(f"Failed to load TFLite model: {e}")
                
        if self.ort_session is None and self.tflite_interpreter is None:
            logger.warning("No models loaded. Inference will be mocked.")

    def _load_vector_store(self) -> None:
        """Loads the VectorStore for RAG (mocked for now)."""
        logger.info(f"Loaded VectorStore from {self.vector_store_path}")
        
    async def process(self, input: AgentInput) -> AgentOutput:
        """
        Processes the input image to diagnose a disease.
        
        Args:
            input: Contains the context with 'image_path' or 'image_b64', 'crop_name', 'plot_context'.
            
        Returns:
            AgentOutput containing the diagnosis and treatment recommendations.
        """
        context = input.context
        image_path = context.get('image_path')
        image_b64 = context.get('image_b64')
        crop_name = context.get('crop_name')
        plot_context = context.get('plot_context', {})
        lang = context.get('lang', 'en')
        
        if not image_path and not image_b64:
            return AgentOutput(status="error", error="No image provided", data={})
            
        try:
            # 1. Preprocess
            preprocessed_image = self._preprocess_image(image_path=image_path, image_b64=image_b64)
            
            # Check Quality
            original_image = self._get_pil_image(image_path=image_path, image_b64=image_b64)
            quality_metrics = self._check_image_quality(original_image)
            
            # 2. Run Inference
            class_idx, confidence, top5_classes = await asyncio.to_thread(self._run_inference, preprocessed_image)
            
            # 3. Map to Disease
            disease_info = self._map_to_disease(class_idx)
            
            # 4. Escalate if needed
            if confidence < self.ESCALATION_THRESHOLD or disease_info.disease_name in self.CRITICAL_DISEASES:
                disease_info.should_escalate = True
                
            # 5. Retrieve Treatment
            treatment = await self._retrieve_treatment(disease_info.disease_name, crop_name, lang)
            
            # 6. Severity Advice
            urgency_message = self._generate_severity_advice(disease_info.severity, disease_info.disease_name)
            
            # 7. Build Response
            response_data = self._build_response(disease_info, treatment, confidence, top5_classes, quality_metrics, urgency_message, lang)
            
            return AgentOutput(status="success", data=response_data)
            
        except Exception as e:
            logger.exception("Error during diagnosis process")
            return AgentOutput(status="error", error=str(e), data={})

    def _get_pil_image(self, image_path: Optional[str] = None, image_b64: Optional[str] = None) -> Image.Image:
        """Helper to get PIL Image from path or b64."""
        if image_path:
            return Image.open(image_path).convert('RGB')
        elif image_b64:
            image_data = base64.b64decode(image_b64)
            return Image.open(io.BytesIO(image_data)).convert('RGB')
        raise ValueError("Must provide image_path or image_b64")

    def _preprocess_image(self, image_path: Optional[str] = None, image_b64: Optional[str] = None) -> np.ndarray:
        """
        Preprocesses the image for model inference.
        
        Args:
            image_path: Path to the image file.
            image_b64: Base64 encoded image string.
            
        Returns:
            Numpy array of shape (1, 3, 224, 224), normalized.
        """
        img = self._get_pil_image(image_path, image_b64)
        
        # Resize
        img = img.resize((224, 224))
        
        # Convert to numpy array and normalize
        img_array = np.array(img).astype(np.float32) / 255.0
        
        # Normalize with ImageNet mean and std
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        img_array = (img_array - mean) / std
        
        # Transpose to (C, H, W) and add batch dimension
        img_array = np.transpose(img_array, (2, 0, 1))
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array

    def _run_inference(self, preprocessed_image: np.ndarray) -> Tuple[int, float, List[Tuple[int, float]]]:
        """
        Runs model inference.
        
        Args:
            preprocessed_image: The processed image array.
            
        Returns:
            Tuple of (class_idx, confidence, top5_classes).
        """
        if self.ort_session:
            input_name = self.ort_session.get_inputs()[0].name
            outputs = self.ort_session.run(None, {input_name: preprocessed_image})
            logits = outputs[0][0]
        elif self.tflite_interpreter:
            return self._run_tflite_inference(preprocessed_image)
        else:
            # Mock inference
            logger.warning("Mocking inference result.")
            logits = np.random.randn(10)
            
        # Softmax
        exp_logits = np.exp(logits - np.max(logits))
        probabilities = exp_logits / exp_logits.sum()
        
        class_idx = int(np.argmax(probabilities))
        confidence = float(probabilities[class_idx])
        
        top5_indices = np.argsort(probabilities)[-5:][::-1]
        top5_classes = [(int(idx), float(probabilities[idx])) for idx in top5_indices]
        
        return class_idx, confidence, top5_classes

    def _run_tflite_inference(self, preprocessed_image: np.ndarray) -> Tuple[int, float, List[Tuple[int, float]]]:
        """Runs fallback TFLite inference."""
        input_details = self.tflite_interpreter.get_input_details()
        output_details = self.tflite_interpreter.get_output_details()
        
        # TFLite typically expects NHWC or NCHW depending on the model, assuming NCHW for consistency
        self.tflite_interpreter.set_tensor(input_details[0]['index'], preprocessed_image)
        self.tflite_interpreter.invoke()
        
        probabilities = self.tflite_interpreter.get_tensor(output_details[0]['index'])[0]
        
        class_idx = int(np.argmax(probabilities))
        confidence = float(probabilities[class_idx])
        
        top5_indices = np.argsort(probabilities)[-5:][::-1]
        top5_classes = [(int(idx), float(probabilities[idx])) for idx in top5_indices]
        
        return class_idx, confidence, top5_classes

    def _check_image_quality(self, image: Image.Image) -> Dict[str, Any]:
        """
        Checks the quality of the image.
        
        Args:
            image: PIL Image object.
            
        Returns:
            Dictionary with quality metrics.
        """
        img_array = np.array(image.convert('L'))
        
        # Basic blur detection using variance of Laplacian
        # Simplified for no cv2 dependency
        blur_score = np.var(np.diff(img_array, axis=0)) + np.var(np.diff(img_array, axis=1))
        
        # Brightness
        brightness = np.mean(img_array)
        
        # Mock leaf detection
        has_leaf_detected = True 
        
        return {
            'blur_score': float(blur_score),
            'brightness': float(brightness),
            'has_leaf_detected': has_leaf_detected,
            'is_quality_good': blur_score > 100.0 and 40 < brightness < 220
        }

    def _map_to_disease(self, class_idx: int) -> DiseaseInfo:
        """Maps a class index to a disease name."""
        # Mock mapping
        disease_map = {
            0: "healthy",
            1: "late_blight",
            2: "early_blight",
            3: "fall_armyworm"
        }
        name = disease_map.get(class_idx, f"unknown_disease_{class_idx}")
        return DiseaseInfo(disease_name=name, class_idx=class_idx, severity="moderate")

    async def _retrieve_treatment(self, disease_name: str, crop_name: Optional[str], lang: str) -> Dict[str, Any]:
        """Retrieves treatment information (mocked KnowledgeBaseAgent interaction)."""
        await asyncio.sleep(0.1) # Simulate async call
        return {
            "chemical": ["Fungicide X", "Pesticide Y"],
            "organic": ["Neem oil extract"],
            "cultural": ["Remove infected leaves", "Ensure good drainage"]
        }

    def _generate_severity_advice(self, severity: str, disease: str) -> str:
        """Generates an urgency message based on severity."""
        if disease in self.CRITICAL_DISEASES:
            return f"CRITICAL: Immediate action required for {disease}."
        if severity == "high":
            return "URGENT: High severity detected. Treat within 24-48 hours."
        return "NOTICE: Monitor the spread and apply preventive measures."

    def _build_response(
        self, 
        disease_info: DiseaseInfo, 
        treatment: Dict[str, Any], 
        confidence: float, 
        top5_classes: List[Tuple[int, float]],
        quality_metrics: Dict[str, Any],
        urgency_message: str,
        lang: str
    ) -> Dict[str, Any]:
        """Builds the final response dictionary."""
        return {
            "disease_name": disease_info.disease_name,
            "confidence": confidence,
            "severity": disease_info.severity,
            "should_escalate": disease_info.should_escalate,
            "treatment": treatment,
            "urgency_message": urgency_message,
            "quality_metrics": quality_metrics,
            "top_5_predictions": [{"class_idx": idx, "confidence": conf} for idx, conf in top5_classes],
            "language": lang
        }
