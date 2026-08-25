"""
evaluate.py — Standalone evaluation script.
Outputs a model_metrics.json and prints a full classification report.
Usage: python ml/evaluate.py
"""
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.train import train
from ml.preprocess import preprocess, DATASET_PATH
from sklearn.metrics import classification_report


def main():
    results = train(evaluate_only=False)
    _, X_test, _, y_test, _, le, _ = preprocess(DATASET_PATH)

    print("\n── Detailed Classification Reports ──")
    for name, data in results.items():
        model = data["model"]
        y_pred = model.predict(X_test)
        print(f"\n{'='*55}")
        print(f"Model: {name}")
        print(classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0))


if __name__ == "__main__":
    main()
