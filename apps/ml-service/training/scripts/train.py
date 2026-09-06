import os
import argparse
import logging
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision.models import mobilenet_v3_large, MobileNet_V3_Large_Weights
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Adjust imports according to actual directory structure when run
try:
    from training.configs.model_config import default_config, DISEASE_CLASSES
    from training.data.dataset_loader import get_dataloaders
except ImportError:
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from configs.model_config import default_config, DISEASE_CLASSES
    from data.dataset_loader import get_dataloaders

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def build_model(config):
    model = mobilenet_v3_large(weights=MobileNet_V3_Large_Weights.IMAGENET1K_V2)
    if config.model.freeze_base_layers:
        for param in model.parameters():
            param.requires_grad = False
            
    num_features = model.classifier[0].in_features
    model.classifier = nn.Sequential(
        nn.Linear(num_features, 1024),
        nn.Hardswish(),
        nn.Dropout(p=config.model.dropout_rate, inplace=True),
        nn.Linear(1024, config.model.num_classes)
    )
    return model

def compute_metrics(y_true, y_pred, y_prob, class_names, output_dir):
    acc = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average='macro')
    weighted_f1 = f1_score(y_true, y_pred, average='weighted')
    per_class_f1 = f1_score(y_true, y_pred, average=None)
    
    cm = confusion_matrix(y_true, y_pred)
    cm_path = plot_confusion_matrix(cm, class_names, output_dir)
    
    return {
        'accuracy': acc,
        'macro_f1': macro_f1,
        'weighted_f1': weighted_f1,
        'per_class_f1': per_class_f1.tolist(),
        'confusion_matrix_path': cm_path
    }

def plot_confusion_matrix(cm, class_names, output_dir):
    plt.figure(figsize=(20, 20))
    sns.heatmap(cm, annot=False, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.ylabel('True')
    plt.xlabel('Predicted')
    plt.title('Confusion Matrix')
    plt.tight_layout()
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, 'confusion_matrix.png')
    plt.savefig(path)
    plt.close()
    return path

def plot_training_curves(history, output_dir):
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(history['train_loss'], label='Train')
    plt.plot(history['val_loss'], label='Val')
    plt.title('Loss')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot(history['train_acc'], label='Train')
    plt.plot(history['val_acc'], label='Val')
    plt.title('Accuracy')
    plt.legend()
    
    os.makedirs(output_dir, exist_ok=True)
    plt.savefig(os.path.join(output_dir, 'training_curves.png'))
    plt.close()

def save_checkpoint(model, optimizer, epoch, metrics, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'metrics': metrics
    }, path)

def load_checkpoint(path, model, optimizer):
    checkpoint = torch.load(path)
    model.load_state_dict(checkpoint['model_state_dict'])
    optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    return checkpoint['epoch'], checkpoint['metrics']

def train_epoch(model, loader, optimizer, criterion, scaler, device):
    model.train()
    running_loss = 0.0
    all_preds = []
    all_labels = []
    
    for inputs, labels, _ in loader:
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        
        with torch.cuda.amp.autocast(enabled=scaler is not None):
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
        if scaler:
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            optimizer.step()
            
        running_loss += loss.item() * inputs.size(0)
        _, preds = torch.max(outputs, 1)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())
        
    epoch_loss = running_loss / len(loader.dataset)
    epoch_acc = accuracy_score(all_labels, all_preds)
    return {'loss': epoch_loss, 'accuracy': epoch_acc}

def validate_epoch(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for inputs, labels, _ in loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
    epoch_loss = running_loss / len(loader.dataset)
    epoch_acc = accuracy_score(all_labels, all_preds)
    return {'loss': epoch_loss, 'accuracy': epoch_acc, 'preds': all_preds, 'labels': all_labels}

def main(args):
    config = default_config()
    if args.data_dir: config.training.data_dir = args.data_dir
    if args.output_dir: config.training.output_dir = args.output_dir
    if args.epochs: config.model.epochs = args.epochs
    if args.batch_size: config.model.batch_size = args.batch_size
    if args.lr: config.model.learning_rate = args.lr

    use_wandb = not args.no_wandb
    if use_wandb:
        try:
            import wandb
            wandb.init(project=config.training.wandb_project, config=config.__dict__)
        except ImportError:
            logger.warning("wandb not installed, running without it.")
            use_wandb = False

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"Using device: {device}")

    train_loader, val_loader, test_loader = get_dataloaders(config, DISEASE_CLASSES)
    
    model = build_model(config).to(device)
    optimizer = optim.Adam(model.classifier.parameters() if config.model.freeze_base_layers else model.parameters(), lr=config.model.learning_rate)
    
    # Class weights calculation placeholder
    weights = train_loader.dataset.class_weights.to(device) if config.model.class_weights_strategy == 'balanced' else None
    criterion = nn.CrossEntropyLoss(weight=weights)
    
    scaler = torch.cuda.amp.GradScaler() if config.model.mixed_precision and device.type == 'cuda' else None
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=config.training.reduce_lr_patience, verbose=True)

    start_epoch = 0
    if args.resume and os.path.exists(args.resume):
        start_epoch, _ = load_checkpoint(args.resume, model, optimizer)
        logger.info(f"Resumed from epoch {start_epoch}")

    best_val_loss = float('inf')
    epochs_no_improve = 0
    history = {'train_loss': [], 'val_loss': [], 'train_acc': [], 'val_acc': []}

    for epoch in range(start_epoch, config.model.epochs):
        logger.info(f"Epoch {epoch+1}/{config.model.epochs}")
        train_metrics = train_epoch(model, train_loader, optimizer, criterion, scaler, device)
        val_metrics = validate_epoch(model, val_loader, criterion, device)
        
        scheduler.step(val_metrics['loss'])
        
        history['train_loss'].append(train_metrics['loss'])
        history['train_acc'].append(train_metrics['accuracy'])
        history['val_loss'].append(val_metrics['loss'])
        history['val_acc'].append(val_metrics['accuracy'])
        
        logger.info(f"Train Loss: {train_metrics['loss']:.4f} Acc: {train_metrics['accuracy']:.4f}")
        logger.info(f"Val Loss: {val_metrics['loss']:.4f} Acc: {val_metrics['accuracy']:.4f}")
        
        if use_wandb:
            wandb.log({
                'train_loss': train_metrics['loss'], 'train_acc': train_metrics['accuracy'],
                'val_loss': val_metrics['loss'], 'val_acc': val_metrics['accuracy'],
                'lr': optimizer.param_groups[0]['lr']
            })

        if val_metrics['loss'] < best_val_loss:
            best_val_loss = val_metrics['loss']
            epochs_no_improve = 0
            save_checkpoint(model, optimizer, epoch, val_metrics, os.path.join(config.training.checkpoint_dir, 'best_model.pth'))
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= config.training.early_stopping_patience:
                logger.info("Early stopping triggered")
                break

    plot_training_curves(history, config.training.output_dir)
    logger.info("Training complete")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=str, default=None)
    parser.add_argument('--data-dir', type=str, default=None)
    parser.add_argument('--output-dir', type=str, default=None)
    parser.add_argument('--epochs', type=int, default=None)
    parser.add_argument('--batch-size', type=int, default=None)
    parser.add_argument('--lr', type=float, default=None)
    parser.add_argument('--resume', type=str, default=None)
    parser.add_argument('--no-wandb', action='store_true')
    args = parser.parse_args()
    main(args)
