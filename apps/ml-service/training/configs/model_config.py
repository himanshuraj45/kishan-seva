import os
from dataclasses import dataclass, field
from typing import List, Dict, Any

DISEASE_CLASSES = [
    "Tomato_Early_blight", "Tomato_Late_blight", "Tomato_Leaf_Mold",
    "Tomato_Septoria_leaf_spot", "Tomato_Spider_mites", "Tomato_Target_Spot",
    "Tomato_Tomato_Yellow_Leaf_Curl_Virus", "Tomato_Tomato_mosaic_virus", "Tomato_healthy",
    "Apple_Apple_scab", "Apple_Black_rot", "Apple_Cedar_apple_rust", "Apple_healthy",
    "Corn_Cercospora_leaf_spot", "Corn_Common_rust", "Corn_Northern_Leaf_Blight", "Corn_healthy",
    "Grape_Black_rot", "Grape_Esca", "Grape_Leaf_blight", "Grape_healthy",
    "Pepper_bell_Bacterial_spot", "Pepper_bell_healthy",
    "Potato_Early_blight", "Potato_Late_blight", "Potato_healthy",
    "Rice_Bacterial_leaf_blight", "Rice_Brown_spot", "Rice_Leaf_smut", "Rice_healthy",
    "Strawberry_Leaf_scorch", "Strawberry_healthy",
    "Wheat_Septoria", "Wheat_Yellow_rust", "Wheat_Brown_rust", "Wheat_healthy",
    "Soybean_Frogeye_leaf_spot", "Soybean_healthy"
]

CROP_TREATMENT_MAP = {
    cls: {
        "severity": "medium",
        "treatment_en": "Apply appropriate fungicide/pesticide.",
        "treatment_hi": "उचित कवकनाशी/कीटनाशक लागू करें।",
        "prevention": "Ensure good air circulation and water at the base.",
        "organic_alternative": "Neem oil spray."
    } for cls in DISEASE_CLASSES
}

@dataclass
class ModelConfig:
    model_name: str = "mobilenet_v3_large"
    num_classes: int = len(DISEASE_CLASSES)
    img_size: int = 224
    batch_size: int = 32
    epochs: int = 50
    learning_rate: float = 1e-3
    dropout_rate: float = 0.2
    use_augmentation: bool = True
    freeze_base_layers: bool = True
    class_weights_strategy: str = "balanced"  # 'balanced' or 'none'
    mixed_precision: bool = True

@dataclass
class AugmentationConfig:
    rotation_range: int = 15
    brightness_range: float = 0.3
    zoom_range: float = 0.2
    horizontal_flip: bool = True
    vertical_flip: bool = False
    gaussian_noise_std: float = 0.1
    contrast_range: float = 0.3

@dataclass
class TrainingConfig:
    data_dir: str = "data/raw"
    output_dir: str = "data/outputs"
    checkpoint_dir: str = "data/checkpoints"
    log_dir: str = "data/logs"
    val_split: float = 0.15
    test_split: float = 0.15
    early_stopping_patience: int = 10
    reduce_lr_patience: int = 5
    save_best_only: bool = True
    wandb_project: str = "kisanseva-disease-detection"

@dataclass
class ExportConfig:
    export_tflite: bool = True
    export_onnx: bool = True
    quantize_tflite: bool = True
    tflite_output_path: str = "data/outputs/model.tflite"
    onnx_output_path: str = "data/outputs/model.onnx"

@dataclass
class KisanSevaConfig:
    model: ModelConfig = field(default_factory=ModelConfig)
    augmentation: AugmentationConfig = field(default_factory=AugmentationConfig)
    training: TrainingConfig = field(default_factory=TrainingConfig)
    export: ExportConfig = field(default_factory=ExportConfig)

def default_config() -> KisanSevaConfig:
    return KisanSevaConfig()
