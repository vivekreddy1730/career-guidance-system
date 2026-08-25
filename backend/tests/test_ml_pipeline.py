"""
test_ml_pipeline.py — Unit tests for preprocess, train, predict modules.
Run: pytest backend/tests/test_ml_pipeline.py -v
"""
import sys
import os
import json
import pickle

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
import numpy as np


class TestPreprocess:
    def test_load_dataset(self):
        from ml.preprocess import load_dataset, DATASET_PATH
        df = load_dataset(DATASET_PATH)
        assert len(df) > 0, "Dataset should not be empty"
        assert "career" in df.columns, "Dataset must have a 'career' column"

    def test_preprocess_returns_correct_shapes(self):
        from ml.preprocess import preprocess, DATASET_PATH
        X_train, X_test, y_train, y_test, feature_names, le, scaler = preprocess(DATASET_PATH)
        assert X_train.shape[0] > 0
        assert X_test.shape[0] > 0
        assert len(feature_names) > 0
        assert len(le.classes_) >= 3

    def test_train_test_split_ratio(self):
        from ml.preprocess import preprocess, DATASET_PATH
        X_train, X_test, *_ = preprocess(DATASET_PATH, test_size=0.2)
        total = X_train.shape[0] + X_test.shape[0]
        test_ratio = X_test.shape[0] / total
        assert 0.15 <= test_ratio <= 0.25

    def test_build_feature_vector(self):
        from ml.preprocess import preprocess, build_feature_vector, DATASET_PATH
        _, _, _, _, feature_names, _, _ = preprocess(DATASET_PATH)
        sample = {"python": 80, "sql": 70, "cgpa": 8.0}
        vec = build_feature_vector(sample, feature_names)
        assert vec.shape == (1, len(feature_names))
        assert not np.isnan(vec).any()


class TestTraining:
    def test_train_produces_models(self, tmp_path, monkeypatch):
        from ml import train as train_module
        monkeypatch.setattr(train_module, "MODELS_DIR", tmp_path)

        results = train_module.train(evaluate_only=False)
        assert len(results) >= 3  # At least RF, DT, KNN

    def test_metrics_keys_present(self, tmp_path, monkeypatch):
        from ml import train as train_module
        monkeypatch.setattr(train_module, "MODELS_DIR", tmp_path)
        results = train_module.train(evaluate_only=False)
        for name, data in results.items():
            metrics = data["metrics"]
            assert "accuracy" in metrics
            assert "f1" in metrics
            assert 0.0 <= metrics["accuracy"] <= 1.0

    def test_best_model_saved(self, tmp_path, monkeypatch):
        from ml import train as train_module
        monkeypatch.setattr(train_module, "MODELS_DIR", tmp_path)
        train_module.train(evaluate_only=False)
        assert (tmp_path / "best_model.pkl").exists()
        assert (tmp_path / "label_encoder.pkl").exists()
        assert (tmp_path / "model_metrics.json").exists()


class TestPredict:
    def test_predict_returns_list(self, tmp_path, monkeypatch):
        from ml import train as train_module, predict as predict_module
        monkeypatch.setattr(train_module, "MODELS_DIR", tmp_path)
        monkeypatch.setattr(predict_module, "MODELS_DIR", tmp_path)

        train_module.train(evaluate_only=False)

        # Reset cached artefacts
        predict_module._model = None
        predict_module._label_encoder = None
        predict_module._scaler = None
        predict_module._feature_names = []

        sample = {
            "python": 90, "machine_learning": 85, "sql": 80,
            "statistics": 75, "cgpa": 8.5
        }
        results = predict_module.predict_career(sample, top_k=3)
        assert isinstance(results, list)
        assert len(results) >= 1
        assert "career" in results[0]
        assert "confidence" in results[0]

    def test_predict_confidence_between_0_and_1(self, tmp_path, monkeypatch):
        from ml import train as train_module, predict as predict_module
        monkeypatch.setattr(train_module, "MODELS_DIR", tmp_path)
        monkeypatch.setattr(predict_module, "MODELS_DIR", tmp_path)
        train_module.train()
        predict_module._model = None
        predict_module._label_encoder = None
        predict_module._scaler = None
        predict_module._feature_names = []

        results = predict_module.predict_career({"python": 70}, top_k=2)
        for r in results:
            assert 0.0 <= r["confidence"] <= 1.0
