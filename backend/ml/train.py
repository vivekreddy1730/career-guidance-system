"""
train.py — Train and compare RandomForest, DecisionTree, XGBoost, and KNN.
Saves the best model, label encoder, scaler, and metrics to disk.

Usage:
    python ml/train.py
    python ml/train.py --evaluate   # print metrics table only
"""
import os
import sys
import json
import pickle
import logging
import argparse
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    classification_report,
)

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

sys.path.insert(0, str(Path(__file__).parent.parent))
from ml.preprocess import preprocess, DATASET_PATH

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)


def get_candidate_models(n_classes: int):
    models = {
        "RandomForest": RandomForestClassifier(
            n_estimators=200,
            max_depth=None,
            min_samples_split=2,
            random_state=42,
            n_jobs=-1,
        ),
        "DecisionTree": DecisionTreeClassifier(
            max_depth=10,
            min_samples_split=2,
            random_state=42,
        ),
        "KNN": KNeighborsClassifier(n_neighbors=5, weights="distance"),
    }
    if HAS_XGB:
        models["XGBoost"] = XGBClassifier(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=6,
            use_label_encoder=False,
            eval_metric="mlogloss",
            random_state=42,
            num_class=n_classes,
        )
    return models


def evaluate_model(model, X_test, y_test, label_encoder):
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    return {"accuracy": round(acc, 4), "f1": round(f1, 4), "precision": round(prec, 4), "recall": round(rec, 4)}


def train(evaluate_only: bool = False):
    X_train, X_test, y_train, y_test, feature_names, le, scaler = preprocess(DATASET_PATH)
    n_classes = len(le.classes_)

    candidates = get_candidate_models(n_classes)
    results = {}

    logger.info("Training %d models...", len(candidates))
    for name, model in candidates.items():
        logger.info("  → %s", name)
        model.fit(X_train, y_train)
        metrics = evaluate_model(model, X_test, y_test, le)
        results[name] = {"model": model, "metrics": metrics}
        logger.info(
            "    Accuracy=%.4f  F1=%.4f  Precision=%.4f  Recall=%.4f",
            metrics["accuracy"], metrics["f1"], metrics["precision"], metrics["recall"],
        )

    # Print comparison table
    print("\n" + "=" * 65)
    print(f"{'Model':<20} {'Accuracy':>10} {'F1':>10} {'Precision':>10} {'Recall':>10}")
    print("-" * 65)
    for name, data in results.items():
        m = data["metrics"]
        print(f"{name:<20} {m['accuracy']:>10.4f} {m['f1']:>10.4f} {m['precision']:>10.4f} {m['recall']:>10.4f}")
    print("=" * 65)

    if evaluate_only:
        return results

    # Pick best model by F1
    best_name = max(results, key=lambda k: results[k]["metrics"]["f1"])
    best_model = results[best_name]["model"]
    best_metrics = results[best_name]["metrics"]
    logger.info("Best model: %s (F1=%.4f)", best_name, best_metrics["f1"])

    # Save artefacts
    with open(MODELS_DIR / "best_model.pkl", "wb") as f:
        pickle.dump({"model": best_model, "name": best_name}, f)
    with open(MODELS_DIR / "label_encoder.pkl", "wb") as f:
        pickle.dump(le, f)
    with open(MODELS_DIR / "scaler.pkl", "wb") as f:
        pickle.dump(scaler, f)
    with open(MODELS_DIR / "feature_names.json", "w") as f:
        json.dump(feature_names, f)

    # Save all metrics
    all_metrics = {k: v["metrics"] for k, v in results.items()}
    all_metrics["best"] = best_name
    with open(MODELS_DIR / "model_metrics.json", "w") as f:
        json.dump(all_metrics, f, indent=2)

    logger.info("✅ Models saved to %s", MODELS_DIR)
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--evaluate", action="store_true", help="Print metrics only, do not save models")
    args = parser.parse_args()
    train(evaluate_only=args.evaluate)
