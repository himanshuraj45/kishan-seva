"""
KisanSeva — MobileNetV3 Training on Google Colab
================================================
Run this script on Google Colab with a GPU runtime:
  Runtime > Change runtime type > T4 GPU

Steps:
  1. Run cell 1: Install dependencies
  2. Run cell 2: Download PlantVillage dataset from Kaggle
  3. Run cell 3: Train MobileNetV3 (fine-tune)
  4. Run cell 4: Evaluate on test set + confusion matrix
  5. Run cell 5: Export ONNX + TFLite
  6. Run cell 6: Download exported models
"""

# ─────────────────────────────────────────────────────────
# CELL 1: Install dependencies
# ─────────────────────────────────────────────────────────
CELL_1 = """
!pip install -q torch torchvision onnx onnxruntime scikit-learn matplotlib seaborn tqdm pillow
!pip install -q kaggle  # For dataset download
print("✓ Dependencies installed")
"""

# ─────────────────────────────────────────────────────────
# CELL 2: Setup Kaggle + Download PlantVillage
# ─────────────────────────────────────────────────────────
CELL_2 = """
import os, zipfile, shutil
from pathlib import Path

# Upload kaggle.json first (get from kaggle.com > Account > API)
from google.colab import files
print("Upload your kaggle.json API key:")
# uploaded = files.upload()
# os.makedirs(os.path.expanduser('~/.kaggle'), exist_ok=True)
# shutil.copy('kaggle.json', os.path.expanduser('~/.kaggle/kaggle.json'))
# os.chmod(os.path.expanduser('~/.kaggle/kaggle.json'), 0o600)

# Download dataset
DATA_DIR = Path('/content/plantvillage')
DATA_DIR.mkdir(exist_ok=True)

# !kaggle datasets download -d abdallahalidev/plantvillage-dataset -p /content/
# !unzip -q /content/plantvillage-dataset.zip -d /content/plantvillage/

# --- DEMO: Create a tiny mock dataset for testing ---
print("Creating mock dataset structure (for demo)...")
CLASSES = [
    'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___healthy',
    'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
    'Corn___Common_rust', 'Corn___Northern_Leaf_Blight', 'Corn___healthy',
    'Apple___Black_rot', 'Apple___healthy',
]
from PIL import Image
import numpy as np, random

for cls in CLASSES:
    cls_dir = DATA_DIR / cls
    cls_dir.mkdir(parents=True, exist_ok=True)
    for i in range(30):  # 30 mock images per class
        img = Image.fromarray(
            (np.random.randint(30, 200, (224, 224, 3)) +
             [random.randint(0, 60), random.randint(50, 120), 0]).clip(0, 255).astype(np.uint8)
        )
        img.save(cls_dir / f'mock_{i:04d}.jpg')

print(f"✓ Mock dataset created: {len(CLASSES)} classes, {len(CLASSES)*30} images")
print("  In production: uncomment the kaggle download lines above")
"""

# ─────────────────────────────────────────────────────────
# CELL 3: Training
# ─────────────────────────────────────────────────────────
CELL_3 = """
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset, random_split
from torchvision import transforms, models
from pathlib import Path
from PIL import Image
import numpy as np, json, time
from collections import defaultdict
from sklearn.metrics import f1_score, classification_report
import matplotlib.pyplot as plt

# ── Config ────────────────────────────────────────────────
DATA_DIR    = Path('/content/plantvillage')
OUTPUT_DIR  = Path('/content/output')
OUTPUT_DIR.mkdir(exist_ok=True)

IMG_SIZE    = 224
BATCH_SIZE  = 32
EPOCHS      = 30          # Increase to 50 for full training
LR          = 1e-3
LR_FINETUNE = 1e-4        # Used after unfreezing base
VAL_SPLIT   = 0.15
PATIENCE    = 6
DEVICE      = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Device: {DEVICE}")

# ── Dataset ───────────────────────────────────────────────
class PlantDiseaseDataset(Dataset):
    def __init__(self, root, transform=None):
        self.samples = []
        self.classes = sorted([d.name for d in root.iterdir() if d.is_dir()])
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}
        for cls in self.classes:
            for img_path in (root / cls).glob('*.jpg'):
                self.samples.append((img_path, self.class_to_idx[cls]))
        self.transform = transform

    def __len__(self): return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert('RGB')
        if self.transform: img = self.transform(img)
        return img, label

train_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(p=0.2),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
    transforms.RandomGrayscale(p=0.05),
    transforms.RandomErasing(p=0.1, scale=(0.02, 0.2)),  # simulate leaf occlusion
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])
val_tf = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

full_ds = PlantDiseaseDataset(DATA_DIR, transform=train_tf)
NUM_CLASSES = len(full_ds.classes)
print(f"Classes: {NUM_CLASSES}, Total images: {len(full_ds)}")

val_size  = int(len(full_ds) * VAL_SPLIT)
test_size = int(len(full_ds) * 0.10)
train_size = len(full_ds) - val_size - test_size
train_ds, val_ds, test_ds = random_split(full_ds, [train_size, val_size, test_size],
                                         generator=torch.Generator().manual_seed(42))
val_ds.dataset.transform  = val_tf
test_ds.dataset.transform = val_tf

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=2, pin_memory=True)
val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=2)
test_loader  = DataLoader(test_ds,  batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

# ── Model ─────────────────────────────────────────────────
def build_model(num_classes, freeze_base=True):
    model = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.DEFAULT)
    if freeze_base:
        for p in model.features.parameters():
            p.requires_grad = False
    # Replace head
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )
    return model

model = build_model(NUM_CLASSES, freeze_base=True).to(DEVICE)
print(f"Model: MobileNetV3-Large, Params (trainable): "
      f"{sum(p.numel() for p in model.parameters() if p.requires_grad):,}")

# ── Compute class weights for imbalanced dataset ──────────
class_counts = defaultdict(int)
for _, label in full_ds.samples:
    class_counts[label] += 1
weights = torch.FloatTensor([1.0 / class_counts[i] for i in range(NUM_CLASSES)])
weights = weights / weights.sum() * NUM_CLASSES

criterion = nn.CrossEntropyLoss(weight=weights.to(DEVICE))
optimizer = optim.AdamW(
    filter(lambda p: p.requires_grad, model.parameters()),
    lr=LR, weight_decay=1e-4
)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=3, factor=0.3, min_lr=1e-6)
scaler    = torch.cuda.amp.GradScaler(enabled=(DEVICE.type == 'cuda'))

# ── Training loop ─────────────────────────────────────────
history = {'train_loss': [], 'val_loss': [], 'train_acc': [], 'val_acc': []}
best_val_acc = 0.0
no_improve   = 0
UNFREEZE_EPOCH = 10  # After epoch 10, unfreeze base layers

for epoch in range(EPOCHS):
    # Phase 2: Unfreeze base layers and fine-tune
    if epoch == UNFREEZE_EPOCH:
        print(f"\\n[Epoch {epoch+1}] Unfreezing base layers for fine-tuning...")
        for p in model.features.parameters():
            p.requires_grad = True
        optimizer = optim.AdamW(model.parameters(), lr=LR_FINETUNE, weight_decay=1e-4)
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS - UNFREEZE_EPOCH)

    # ── Train ────────────────────────────────────────────
    model.train()
    t_loss, t_correct, t_total = 0.0, 0, 0
    for imgs, labels in train_loader:
        imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
        optimizer.zero_grad()
        with torch.cuda.amp.autocast(enabled=(DEVICE.type == 'cuda')):
            logits = model(imgs)
            loss   = criterion(logits, labels)
        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        scaler.step(optimizer)
        scaler.update()

        t_loss    += loss.item() * imgs.size(0)
        t_correct += (logits.argmax(1) == labels).sum().item()
        t_total   += imgs.size(0)

    # ── Validate ──────────────────────────────────────────
    model.eval()
    v_loss, v_correct, v_total = 0.0, 0, 0
    with torch.no_grad():
        for imgs, labels in val_loader:
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
            with torch.cuda.amp.autocast(enabled=(DEVICE.type == 'cuda')):
                logits = model(imgs)
                loss   = criterion(logits, labels)
            v_loss    += loss.item() * imgs.size(0)
            v_correct += (logits.argmax(1) == labels).sum().item()
            v_total   += imgs.size(0)

    train_acc = t_correct / t_total
    val_acc   = v_correct / v_total
    scheduler.step(v_loss / v_total)

    history['train_loss'].append(t_loss / t_total)
    history['val_loss'].append(v_loss / v_total)
    history['train_acc'].append(train_acc)
    history['val_acc'].append(val_acc)

    print(f"Epoch {epoch+1:02d}/{EPOCHS} | "
          f"Train Loss: {t_loss/t_total:.4f} Acc: {train_acc:.3f} | "
          f"Val Loss: {v_loss/v_total:.4f} Acc: {val_acc:.3f}")

    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save({
            'epoch': epoch + 1, 'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'val_acc': val_acc, 'class_names': full_ds.classes,
        }, OUTPUT_DIR / 'best_model.pth')
        no_improve = 0
        print(f"  ✓ Best model saved (val_acc={val_acc:.3f})")
    else:
        no_improve += 1
        if no_improve >= PATIENCE:
            print(f"Early stopping at epoch {epoch+1}")
            break

# ── Plot training curves ───────────────────────────────────
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
ax1.plot(history['train_loss'], label='Train', color='#e8b672')
ax1.plot(history['val_loss'],   label='Val',   color='#7a9779')
ax1.set_title('Loss'); ax1.legend(); ax1.set_xlabel('Epoch')
ax2.plot(history['train_acc'], label='Train', color='#e8b672')
ax2.plot(history['val_acc'],   label='Val',   color='#7a9779')
ax2.set_title('Accuracy'); ax2.legend(); ax2.set_xlabel('Epoch')
plt.savefig(OUTPUT_DIR / 'training_curves.png', dpi=150, bbox_inches='tight')
plt.show()
print(f"✓ Training complete | Best Val Acc: {best_val_acc:.4f}")
"""

# ─────────────────────────────────────────────────────────
# CELL 4: Evaluation
# ─────────────────────────────────────────────────────────
CELL_4 = """
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report, f1_score

# Load best model
ckpt = torch.load(OUTPUT_DIR / 'best_model.pth', map_location=DEVICE)
model.load_state_dict(ckpt['model_state_dict'])
model.eval()
class_names = ckpt['class_names']
print(f"Loaded best model from epoch {ckpt['epoch']} (val_acc={ckpt['val_acc']:.4f})")

# ── Test set evaluation ────────────────────────────────────
all_preds, all_labels, all_probs = [], [], []
with torch.no_grad():
    for imgs, labels in test_loader:
        imgs = imgs.to(DEVICE)
        with torch.cuda.amp.autocast(enabled=(DEVICE.type == 'cuda')):
            logits = model(imgs)
        probs = torch.softmax(logits, dim=1).cpu().numpy()
        preds = logits.argmax(1).cpu().numpy()
        all_preds.extend(preds)
        all_labels.extend(labels.numpy())
        all_probs.extend(probs)

all_preds  = np.array(all_preds)
all_labels = np.array(all_labels)
all_probs  = np.array(all_probs)

test_acc = (all_preds == all_labels).mean()
macro_f1 = f1_score(all_labels, all_preds, average='macro')
weighted_f1 = f1_score(all_labels, all_preds, average='weighted')

print(f"\\n=== TEST SET RESULTS ===")
print(f"Accuracy:    {test_acc:.4f} ({test_acc*100:.1f}%)")
print(f"Macro F1:    {macro_f1:.4f}")
print(f"Weighted F1: {weighted_f1:.4f}")

# ── Classification report ─────────────────────────────────
report = classification_report(all_labels, all_preds, target_names=class_names, digits=3)
print("\\n" + report)
with open(OUTPUT_DIR / 'classification_report.txt', 'w') as f:
    f.write(report)

# ── Confusion matrix (top-20 classes for readability) ─────
cm = confusion_matrix(all_labels, all_preds)
n_display = min(20, len(class_names))
cm_display = cm[:n_display, :n_display]
labels_display = [c.replace('___', '\\n') for c in class_names[:n_display]]

plt.figure(figsize=(16, 14))
sns.heatmap(cm_display, annot=True, fmt='d', cmap='YlOrBr',
            xticklabels=labels_display, yticklabels=labels_display,
            linewidths=0.5, linecolor='#efe9e0')
plt.title('Confusion Matrix (Test Set)', fontsize=16, pad=20)
plt.ylabel('True Label'); plt.xlabel('Predicted Label')
plt.xticks(rotation=45, ha='right', fontsize=8)
plt.yticks(rotation=0, fontsize=8)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / 'confusion_matrix.png', dpi=150, bbox_inches='tight')
plt.show()

# ── Save evaluation report JSON ───────────────────────────
report_dict = {
    'test_accuracy': float(test_acc),
    'macro_f1': float(macro_f1),
    'weighted_f1': float(weighted_f1),
    'num_classes': len(class_names),
    'class_names': class_names,
}
with open(OUTPUT_DIR / 'eval_report.json', 'w') as f:
    json.dump(report_dict, f, indent=2)
print(f"✓ Evaluation complete — results saved to {OUTPUT_DIR}")
"""

# ─────────────────────────────────────────────────────────
# CELL 5: Export ONNX + TFLite
# ─────────────────────────────────────────────────────────
CELL_5 = """
import onnx, onnxruntime as ort
from torch.onnx import export as onnx_export

# ── 1. Export ONNX ────────────────────────────────────────
ONNX_PATH = OUTPUT_DIR / 'kisanseva_mobilenetv3.onnx'
dummy_input = torch.randn(1, 3, IMG_SIZE, IMG_SIZE).to(DEVICE)
model.eval()

onnx_export(
    model.cpu(), dummy_input.cpu(),
    f=str(ONNX_PATH),
    input_names=['image'],
    output_names=['logits'],
    dynamic_axes={'image': {0: 'batch'}, 'logits': {0: 'batch'}},
    opset_version=17,
    do_constant_folding=True,
)
model.to(DEVICE)

# Verify ONNX
onnx_model = onnx.load(str(ONNX_PATH))
onnx.checker.check_model(onnx_model)
print(f"✓ ONNX export verified: {ONNX_PATH}")
print(f"  Size: {ONNX_PATH.stat().st_size / 1e6:.1f} MB")

# ── 2. Benchmark ONNX inference ───────────────────────────
sess = ort.InferenceSession(str(ONNX_PATH), providers=['CPUExecutionProvider'])
test_img = np.random.randn(1, 3, IMG_SIZE, IMG_SIZE).astype(np.float32)
N = 50
import time
times = []
for _ in range(N):
    t0 = time.perf_counter()
    sess.run(None, {'image': test_img})
    times.append((time.perf_counter() - t0) * 1000)
times = sorted(times)
print(f"  Inference latency: mean={np.mean(times):.1f}ms p50={times[N//2]:.1f}ms p95={times[int(N*0.95)]:.1f}ms")

# ── 3. Try TFLite export (requires tensorflow) ─────────────
try:
    import tensorflow as tf
    print("\\nConverting to TFLite (INT8 quantized)...")

    class ONNXtoTF:
        \"\"\"Convert via ONNX → TF → TFLite pipeline.\"\"\"
        pass  # In production: use onnx-tf or onnxruntime-extensions

    # Simplified: use TensorFlow directly from PyTorch state dict
    # For production use: pip install onnx-tf && onnx-tf convert -i model.onnx -o model_tf/
    print("  TFLite conversion requires: pip install onnx-tf")
    print("  Run: onnx-tf convert -i kisanseva_mobilenetv3.onnx -o kisanseva_tf/")
    print("  Then: tflite_convert --saved_model_dir=kisanseva_tf/ --output_file=kisanseva.tflite")

except ImportError:
    print("  TensorFlow not installed — skipping TFLite export")
    print("  Install: pip install tensorflow && pip install onnx-tf")

# ── 4. Save class names alongside model ───────────────────
with open(OUTPUT_DIR / 'class_names.json', 'w') as f:
    json.dump({'classes': class_names, 'num_classes': len(class_names)}, f, indent=2)

print(f"\\n✓ All exports complete:")
print(f"  ONNX model:  {ONNX_PATH}")
print(f"  Class names: {OUTPUT_DIR / 'class_names.json'}")
"""

# ─────────────────────────────────────────────────────────
# CELL 6: Download outputs
# ─────────────────────────────────────────────────────────
CELL_6 = """
import shutil
from google.colab import files

# Zip all outputs
shutil.make_archive('/content/kisanseva_model', 'zip', '/content/output')
files.download('/content/kisanseva_model.zip')
print(\"\"\"
✓ Download complete!

After downloading, extract and place files:
  kisanseva_mobilenetv3.onnx     → apps/ml-service/training/models/
  class_names.json               → apps/ml-service/training/models/
  eval_report.json               → apps/ml-service/training/models/
  training_curves.png            → apps/ml-service/training/
  confusion_matrix.png           → apps/ml-service/training/

Then update config.toml:
  [model]
  onnx_model_path = 'training/models/kisanseva_mobilenetv3.onnx'
\"\"\")
"""

# ─────────────────────────────────────────────────────────
# Write as a .py script with cell markers for easy copy-paste
# ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 70)
    print("KisanSeva Colab Training Notebook")
    print("Copy each CELL_N into a Colab code cell and run in order.")
    print("=" * 70)
    for i, cell in enumerate([CELL_1, CELL_2, CELL_3, CELL_4, CELL_5, CELL_6], 1):
        print(f"\n{'='*70}\n# CELL {i}\n{'='*70}")
        print(cell.strip())
