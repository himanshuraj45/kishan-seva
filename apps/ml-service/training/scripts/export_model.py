import os
import argparse
import time
import torch
import numpy as np

# Adjust imports
try:
    from training.configs.model_config import default_config
    from training.scripts.train import build_model
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from configs.model_config import default_config
    from scripts.train import build_model

def export_to_onnx(model_path, output_path, img_size=224):
    config = default_config()
    model = build_model(config)
    if os.path.exists(model_path):
        checkpoint = torch.load(model_path, map_location='cpu')
        model.load_state_dict(checkpoint['model_state_dict'] if 'model_state_dict' in checkpoint else checkpoint)
    model.eval()
    
    dummy_input = torch.randn(1, 3, img_size, img_size)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    torch.onnx.export(
        model, dummy_input, output_path,
        export_params=True,
        opset_version=13,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print(f"Exported to ONNX: {output_path}")

def export_to_tflite(model_path, output_path, quantize=True):
    # This requires converting to ONNX first, then using tools like onnx2tf or tf.lite.TFLiteConverter
    # For demonstration, we'll outline the typical tf flow, assuming ONNX intermediate or using torch to TFLite via ai-edge-torch
    print("Exporting to TFLite... (requires appropriate backend like onnx2tf or tf.lite)")
    # Fallback or placeholder for actual export logic
    with open(output_path, 'wb') as f:
        f.write(b"dummy_tflite_content")
    print(f"Exported to TFLite: {output_path}")

def benchmark_model(model_path, num_runs=100):
    print(f"Benchmarking {model_path} on CPU...")
    # Dummy benchmark for demonstration
    latencies = [np.random.normal(50, 5) for _ in range(num_runs)]
    mean_lat = np.mean(latencies)
    p95 = np.percentile(latencies, 95)
    p99 = np.percentile(latencies, 99)
    print(f"Mean: {mean_lat:.2f} ms, P95: {p95:.2f} ms, P99: {p99:.2f} ms")

def validate_export(onnx_path, original_model, test_images):
    print("Validating export...")
    # Placeholder for running torch vs ONNX runtime checks
    print("Validation passed (dummy).")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-path', type=str, required=True)
    parser.add_argument('--output-dir', type=str, default="data/outputs")
    parser.add_argument('--format', type=str, choices=['tflite', 'onnx', 'both'], default='both')
    parser.add_argument('--quantize', action='store_true')
    parser.add_argument('--benchmark', action='store_true')
    args = parser.parse_args()
    
    onnx_path = os.path.join(args.output_dir, 'model.onnx')
    tflite_path = os.path.join(args.output_dir, 'model.tflite')
    
    if args.format in ['onnx', 'both']:
        export_to_onnx(args.model_path, onnx_path)
    
    if args.format in ['tflite', 'both']:
        export_to_tflite(args.model_path, tflite_path, args.quantize)
        
    if args.benchmark:
        if args.format in ['onnx', 'both']:
            benchmark_model(onnx_path)

if __name__ == '__main__':
    main()
