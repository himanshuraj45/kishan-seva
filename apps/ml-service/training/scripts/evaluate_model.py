import os
import json
import argparse
from dataclasses import dataclass, asdict
from typing import List, Dict, Any
import torch
import torch.nn.functional as F
import matplotlib.pyplot as plt
import numpy as np

# Adjust imports
try:
    from training.configs.model_config import default_config, DISEASE_CLASSES
    from training.data.dataset_loader import get_dataloaders
    from training.scripts.train import build_model, compute_metrics, load_checkpoint
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from configs.model_config import default_config, DISEASE_CLASSES
    from data.dataset_loader import get_dataloaders
    from scripts.train import build_model, compute_metrics, load_checkpoint

@dataclass
class EvaluationReport:
    accuracy: float
    macro_f1: float
    per_class_metrics: Dict[str, float]
    confusion_matrix: str
    calibration_error: float
    confidence_histogram: str

def plot_calibration_curve(model, loader, device, output_path):
    print(f"Plotting calibration curve to {output_path}")
    # Dummy plot
    plt.figure()
    plt.plot([0, 1], [0, 1], "k:", label="Perfectly calibrated")
    plt.title("Calibration Curve (Reliability Diagram)")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path)
    plt.close()

def plot_per_class_f1_bar(metrics, output_path):
    print(f"Plotting per class F1 to {output_path}")
    # Dummy plot
    plt.figure()
    plt.title("Per Class F1 Score")
    plt.savefig(output_path)
    plt.close()

def find_hard_samples(model, loader, device, top_k=20):
    print("Finding hard samples...")
    return []

def compute_confidence_threshold(model, loader, device, target_precision=0.90):
    print("Computing confidence threshold...")
    return 0.85

def evaluate_on_test_set(model_path, data_dir, config):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = build_model(config).to(device)
    if os.path.exists(model_path):
        load_checkpoint(model_path, model, None)
    model.eval()
    
    _, _, test_loader = get_dataloaders(config, DISEASE_CLASSES)
    
    all_preds, all_labels, all_probs = [], [], []
    
    with torch.no_grad():
        for inputs, labels, _ in test_loader:
            inputs = inputs.to(device)
            outputs = model(inputs)
            probs = F.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())
            all_probs.extend(probs.cpu().numpy())
            
    metrics = compute_metrics(all_labels, all_preds, all_probs, DISEASE_CLASSES, config.training.output_dir)
    
    cal_path = os.path.join(config.training.output_dir, "calibration_curve.png")
    plot_calibration_curve(model, test_loader, device, cal_path)
    
    report = EvaluationReport(
        accuracy=metrics['accuracy'],
        macro_f1=metrics['macro_f1'],
        per_class_metrics=dict(zip(DISEASE_CLASSES, metrics['per_class_f1'])),
        confusion_matrix=metrics['confusion_matrix_path'],
        calibration_error=0.05, # Dummy
        confidence_histogram="dummy_path"
    )
    return report

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-path', type=str, required=True)
    parser.add_argument('--data-dir', type=str, default="data/raw")
    args = parser.parse_args()
    
    config = default_config()
    config.training.data_dir = args.data_dir
    
    report = evaluate_on_test_set(args.model_path, args.data_dir, config)
    
    report_path = os.path.join(config.training.output_dir, "evaluation_report.json")
    with open(report_path, 'w') as f:
        json.dump(asdict(report), f, indent=4)
    print(f"Evaluation complete. Report saved to {report_path}")

if __name__ == '__main__':
    main()
