"""
predict.py — Load saved model artefacts and expose predict_career().
Auto-trains if no model file is found.
"""
import os
import json
import pickle
import logging
from pathlib import Path
from typing import List, Dict, Any

import numpy as np

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent / "models"

_model = None
_label_encoder = None
_scaler = None
_feature_names: List[str] = []


def _load_artefacts():
    global _model, _label_encoder, _scaler, _feature_names

    model_path = MODELS_DIR / "best_model.pkl"
    if not model_path.exists():
        logger.warning("No trained model found. Running training now...")
        import sys
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from ml.train import train
        train()

    with open(MODELS_DIR / "best_model.pkl", "rb") as f:
        data = pickle.load(f)
        _model = data["model"]

    with open(MODELS_DIR / "label_encoder.pkl", "rb") as f:
        _label_encoder = pickle.load(f)

    with open(MODELS_DIR / "scaler.pkl", "rb") as f:
        _scaler = pickle.load(f)

    with open(MODELS_DIR / "feature_names.json") as f:
        _feature_names = json.load(f)

    logger.info("ML model artefacts loaded (%d features, %d classes)", len(_feature_names), len(_label_encoder.classes_))


def get_feature_names() -> List[str]:
    if not _feature_names:
        _load_artefacts()
    return _feature_names


def predict_career(student_data: Dict[str, Any], top_k: int = 3) -> List[Dict]:
    """
    Predict top_k careers for a student.

    Args:
        student_data: flat dict mapping skill/metric names → numeric scores
        top_k: number of ranked results to return

    Returns:
        List of dicts: [{"career": str, "confidence": float}, ...]
    """
    global _model, _label_encoder, _scaler, _feature_names

    if _model is None:
        _load_artefacts()

    from ml.preprocess import build_feature_vector

    X = build_feature_vector(student_data, _feature_names)
    X_scaled = _scaler.transform(X)

    # Get probabilities if available, else use predict
    if hasattr(_model, "predict_proba"):
        probs = _model.predict_proba(X_scaled)[0]
        top_indices = np.argsort(probs)[::-1][:top_k]
        results = [
            {
                "career": _label_encoder.classes_[i],
                "confidence": round(float(probs[i]), 4),
                "rank": rank + 1,
            }
            for rank, i in enumerate(top_indices)
        ]
    else:
        pred = _model.predict(X_scaled)[0]
        results = [
            {"career": _label_encoder.classes_[pred], "confidence": 1.0, "rank": 1}
        ]

    return results
