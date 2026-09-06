"""
Image preprocessing utilities for KisanSeva ML service.
Shared by DiagnosisAgent and the training pipeline.
"""
from __future__ import annotations

import base64
import io
import logging
from pathlib import Path
from typing import Optional, Tuple, Union

import numpy as np

logger = logging.getLogger(__name__)

# ImageNet normalisation constants
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

DEFAULT_IMG_SIZE = 224


def load_image_from_path(path: Union[str, Path]) -> "np.ndarray":
    """Load an RGB image from disk as a uint8 NumPy array.

    Args:
        path: Absolute or relative path to the image file.

    Returns:
        NumPy array of shape (H, W, 3) in RGB uint8.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file cannot be decoded as an image.
    """
    try:
        from PIL import Image
    except ImportError:
        raise ImportError("Pillow is required: pip install Pillow")

    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Image not found: {p}")

    try:
        img = Image.open(p).convert("RGB")
        return np.array(img, dtype=np.uint8)
    except Exception as exc:
        raise ValueError(f"Cannot decode image at {p}: {exc}") from exc


def load_image_from_base64(b64_string: str) -> "np.ndarray":
    """Decode a base64-encoded image string into a NumPy array.

    Handles both plain base64 and data-URI format:
    ``data:image/jpeg;base64,<data>``

    Args:
        b64_string: Base64-encoded image bytes.

    Returns:
        NumPy array of shape (H, W, 3) in RGB uint8.
    """
    try:
        from PIL import Image
    except ImportError:
        raise ImportError("Pillow is required: pip install Pillow")

    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]

    try:
        raw = base64.b64decode(b64_string)
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        return np.array(img, dtype=np.uint8)
    except Exception as exc:
        raise ValueError(f"Cannot decode base64 image: {exc}") from exc


def preprocess_for_inference(
    image: "np.ndarray",
    img_size: int = DEFAULT_IMG_SIZE,
) -> "np.ndarray":
    """Resize, normalize, and add batch dimension for model inference.

    Args:
        image: Raw RGB uint8 array (H, W, 3).
        img_size: Target square size for the model input.

    Returns:
        Float32 array of shape (1, img_size, img_size, 3) normalised to
        ImageNet statistics.
    """
    try:
        from PIL import Image
    except ImportError:
        raise ImportError("Pillow is required: pip install Pillow")

    pil = Image.fromarray(image).resize((img_size, img_size), Image.BICUBIC)
    arr = np.array(pil, dtype=np.float32) / 255.0
    arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
    return np.expand_dims(arr, axis=0)  # (1, H, W, 3)


def check_image_quality(image: "np.ndarray") -> dict:
    """Assess image quality for diagnosis reliability.

    Computes blur score (Laplacian variance), mean brightness, and
    performs a simple green-pixel ratio check as a rough leaf detector.

    Args:
        image: RGB uint8 array.

    Returns:
        dict with keys:
            - blur_score (float): Higher = sharper. <100 is blurry.
            - brightness (float): Mean pixel value 0-255.
            - is_blurry (bool)
            - is_too_dark (bool)
            - is_too_bright (bool)
            - has_leaf_likely (bool): rough heuristic
            - warnings (List[str])
    """
    try:
        import cv2  # type: ignore
    except ImportError:
        # Fallback without OpenCV
        brightness = float(image.mean())
        return {
            "blur_score": None,
            "brightness": brightness,
            "is_blurry": False,
            "is_too_dark": brightness < 40,
            "is_too_bright": brightness > 220,
            "has_leaf_likely": True,
            "warnings": [],
        }

    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(image.mean())

    # Green channel dominance as leaf proxy
    r, g, b = image[:, :, 0], image[:, :, 1], image[:, :, 2]
    green_px = np.sum((g > r) & (g > b))
    has_leaf = (green_px / image.size * 3) > 0.10  # >10% green pixels

    warnings: list[str] = []
    if blur_score < 100:
        warnings.append("Image appears blurry — retake in good lighting")
    if brightness < 40:
        warnings.append("Image too dark — move to brighter area")
    if brightness > 220:
        warnings.append("Image overexposed — avoid direct sunlight on leaf")
    if not has_leaf:
        warnings.append("No leaf clearly detected — ensure leaf fills the frame")

    return {
        "blur_score": blur_score,
        "brightness": brightness,
        "is_blurry": blur_score < 100,
        "is_too_dark": brightness < 40,
        "is_too_bright": brightness > 220,
        "has_leaf_likely": has_leaf,
        "warnings": warnings,
    }


def softmax(x: "np.ndarray") -> "np.ndarray":
    """Numerically stable softmax.

    Args:
        x: 1-D float array of raw logits.

    Returns:
        Probability distribution summing to 1.
    """
    e = np.exp(x - x.max())
    return e / e.sum()


def top_k_predictions(
    logits: "np.ndarray",
    class_names: list[str],
    k: int = 5,
) -> list[dict]:
    """Return top-k predicted classes with probabilities.

    Args:
        logits: Raw model output array of shape (num_classes,).
        class_names: Ordered list of class name strings.
        k: Number of top predictions to return.

    Returns:
        List of dicts with 'class_name', 'class_idx', 'probability'.
    """
    probs = softmax(logits.flatten())
    indices = np.argsort(probs)[::-1][:k]
    return [
        {
            "class_name": class_names[i],
            "class_idx": int(i),
            "probability": float(probs[i]),
        }
        for i in indices
    ]
