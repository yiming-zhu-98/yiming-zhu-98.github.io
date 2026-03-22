---
id: research-3
emoji: 🔭
image: ""
date: 2025-03-15
title: Deep Learning for Astronomical Image Classification
title_zh: 用于天文图像分类的深度学习
excerpt: An investigation into convolutional neural networks applied to classifying galaxies and nebulae from telescope imagery.
excerpt_zh: 研究将卷积神经网络应用于从望远镜图像中分类星系和星云的方法。
---

# Deep Learning for Astronomical Image Classification

## Abstract

This research explores the application of **convolutional neural networks (CNNs)** to classify astronomical objects from telescope imagery, achieving 94.3% accuracy on the benchmark dataset.

## Methodology

We trained a ResNet-50 model on the Galaxy Zoo dataset:

- 270,000 labeled galaxy images
- Data augmentation: rotation, flipping, color jitter
- Transfer learning from ImageNet weights

```python
import torch, torchvision
model = torchvision.models.resnet50(pretrained=True)
model.fc = torch.nn.Linear(2048, num_classes)
```

## Results

| Model      | Accuracy | F1 Score |
|------------|----------|----------|
| ResNet-50  | 94.3%    | 0.941    |
| VGG-16     | 91.2%    | 0.909    |
| Custom CNN | 87.5%    | 0.872    |

## Conclusion

Deep learning significantly outperforms classical methods for astronomical classification tasks.

---zh---

# 用于天文图像分类的深度学习

## 摘要

本研究探索将**卷积神经网络（CNN）**应用于从望远镜图像中分类天文对象，在基准数据集上达到了94.3%的准确率。

## 方法论

我们在Galaxy Zoo数据集上训练了ResNet-50模型：

- 270,000张有标签的星系图像
- 数据增强：旋转、翻转、色彩抖动
- 基于ImageNet权重的迁移学习

```python
import torch, torchvision
model = torchvision.models.resnet50(pretrained=True)
model.fc = torch.nn.Linear(2048, num_classes)
```

## 结果

| 模型      | 准确率 | F1分数 |
|-----------|--------|--------|
| ResNet-50 | 94.3%  | 0.941  |
| VGG-16    | 91.2%  | 0.909  |
| 自定义CNN | 87.5%  | 0.872  |

## 结论

深度学习在天文分类任务中显著优于传统方法。
