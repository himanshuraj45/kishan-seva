import os
import random
from pathlib import Path
from collections import Counter
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image

class PlantVillageDataset(Dataset):
    def __init__(self, root_dir: str, transform=None, split: str = 'train', val_split: float = 0.15, test_split: float = 0.15, seed: int = 42, disease_classes: list = None):
        self.root_dir = Path(root_dir)
        self.transform = transform
        self.split = split
        self.disease_classes = disease_classes or []
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.disease_classes)}
        
        self.samples = []
        # Simulate loading from root_dir structure
        if self.root_dir.exists():
            for cls_folder in self.root_dir.iterdir():
                if cls_folder.is_dir() and cls_folder.name in self.class_to_idx:
                    for img_path in cls_folder.glob("*.jpg"):
                        self.samples.append((str(img_path), self.class_to_idx[cls_folder.name]))
        
        # Shuffle and split
        random.seed(seed)
        random.shuffle(self.samples)
        
        n = len(self.samples)
        n_val = int(n * val_split)
        n_test = int(n * test_split)
        n_train = n - n_val - n_test
        
        if split == 'train':
            self.samples = self.samples[:n_train]
        elif split == 'val':
            self.samples = self.samples[n_train:n_train + n_val]
        elif split == 'test':
            self.samples = self.samples[n_train + n_val:]
            
    def __len__(self):
        return len(self.samples)
        
    def __getitem__(self, idx: int):
        filepath, label = self.samples[idx]
        try:
            image = Image.open(filepath).convert('RGB')
        except Exception:
            # Fallback for missing/corrupted files during dry run
            image = Image.new('RGB', (224, 224), color='black')
            
        if self.transform:
            image = self.transform(image)
            
        return image, label, filepath
        
    @property
    def class_weights(self) -> torch.Tensor:
        counts = Counter([label for _, label in self.samples])
        weights = [0.0] * len(self.class_to_idx)
        total = len(self.samples)
        for label, count in counts.items():
            if count > 0:
                weights[label] = total / (len(self.class_to_idx) * count)
        return torch.tensor(weights, dtype=torch.float)

def get_dataloaders(config, disease_classes):
    train_transform = transforms.Compose([
        transforms.Resize((config.model.img_size, config.model.img_size)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(config.augmentation.rotation_range),
        transforms.ColorJitter(brightness=config.augmentation.brightness_range, contrast=config.augmentation.contrast_range),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        transforms.GaussianBlur(3),
        transforms.RandomGrayscale(p=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2)
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(config.model.img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    train_dataset = PlantVillageDataset(config.training.data_dir, transform=train_transform, split='train', 
                                        val_split=config.training.val_split, test_split=config.training.test_split, 
                                        disease_classes=disease_classes)
    val_dataset = PlantVillageDataset(config.training.data_dir, transform=val_transform, split='val', 
                                      val_split=config.training.val_split, test_split=config.training.test_split, 
                                      disease_classes=disease_classes)
    test_dataset = PlantVillageDataset(config.training.data_dir, transform=val_transform, split='test', 
                                       val_split=config.training.val_split, test_split=config.training.test_split, 
                                       disease_classes=disease_classes)
                                       
    train_loader = DataLoader(train_dataset, batch_size=config.model.batch_size, shuffle=True, num_workers=4)
    val_loader = DataLoader(val_dataset, batch_size=config.model.batch_size, shuffle=False, num_workers=4)
    test_loader = DataLoader(test_dataset, batch_size=config.model.batch_size, shuffle=False, num_workers=4)
    
    return train_loader, val_loader, test_loader

def download_plantvillage(output_dir: str):
    print("To download the dataset, please use Kaggle CLI:")
    print("kaggle datasets download -d abdallahalbin/plantvillage-dataset")
    print(f"Extract it and organize as: {output_dir}/<class_name>/<image.jpg>")
    Path(output_dir).mkdir(parents=True, exist_ok=True)
