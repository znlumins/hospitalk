import pickle
import numpy as np
import json
import math
import os
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

# Set random seed for reproducibility
np.random.seed(42)

def generate_synthetic_features(num_samples, num_features):
    print(f"Generating {num_samples} synthetic features for size {num_features}...")
    features = []
    
    # Generate realistic hand points coordinate distance representations
    for _ in range(num_samples):
        # A hand has 21 points in 3D
        points = np.random.rand(21, 3)
        distances = []
        for i in range(21):
            for j in range(i + 1, 21):
                p1, p2 = points[i], points[j]
                dist = math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2 + (p1[2]-p2[2])**2)
                distances.append(dist)
        
        max_dist = max(distances) if distances else 1
        normalized_dists = [d / max_dist for d in distances]
        
        if num_features == 420:
            # Bisindo expects two hands
            points_right = np.random.rand(21, 3)
            distances_right = []
            for i in range(21):
                for j in range(i + 1, 21):
                    p1, p2 = points_right[i], points_right[j]
                    dist = math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2 + (p1[2]-p2[2])**2)
                    distances_right.append(dist)
            max_dist_right = max(distances_right) if distances_right else 1
            normalized_dists_right = [d / max_dist_right for d in distances_right]
            
            features.append(normalized_dists + normalized_dists_right)
        else:
            # Sibi expects one hand
            features.append(normalized_dists)
            
    return np.array(features, dtype=np.float32)

def distill_and_save(pkl_path, output_json_path, num_features):
    print(f"\n--- Starting Distillation for {pkl_path} ---")
    
    # 1. Load trained RandomForest
    with open(pkl_path, 'rb') as f:
        rf_model = pickle.load(f)
    
    classes = [str(c) for c in rf_model.classes_]
    num_classes = len(classes)
    
    # 2. Generate Synthetic Dataset
    X = generate_synthetic_features(20000, num_features)
    
    # Generate labels using the pre-trained Random Forest
    print("Generating training labels using RandomForest...")
    y_labels = rf_model.predict(X)
    
    # Map string classes to integer indices
    class_to_idx = {c: i for i, c in enumerate(classes)}
    y = np.array([class_to_idx[str(label)] for label in y_labels], dtype=np.int32)
    
    # 3. Define and train Keras Model
    print("Building Keras Sequential MLP model...")
    model = Sequential([
        Dense(128, activation='relu', input_shape=(num_features,)),
        Dense(64, activation='relu'),
        Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("Training Keras model (knowledge distillation)...")
    model.fit(X, y, epochs=15, batch_size=64, verbose=1)
    
    # 4. Extract weights
    print("Extracting layer weights...")
    w1, b1 = model.layers[0].get_weights()
    w2, b2 = model.layers[1].get_weights()
    w3, b3 = model.layers[2].get_weights()
    
    # 5. Export weights to JSON
    tfjs_weights = {
        "classes": classes,
        "w1": w1.tolist(),
        "b1": b1.tolist(),
        "w2": w2.tolist(),
        "b2": b2.tolist(),
        "w3": w3.tolist(),
        "b3": b3.tolist()
    }
    
    with open(output_json_path, 'w') as f:
        json.dump(tfjs_weights, f)
        
    print(f"[OK] Distillation and weights export completed successfully: {output_json_path}")

if __name__ == "__main__":
    distill_and_save('model_bisindo.pkl', 'model_bisindo_tfjs.json', 420)
    distill_and_save('model_sibi.pkl', 'model_sibi_tfjs.json', 210)
