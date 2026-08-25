"""
preprocess.py — Load and preprocess the career prediction dataset.
Handles real-world 50k dataset with one-hot encoding, scaling, and train/test splits.
"""
import os
import json
import logging
from typing import Tuple, List, Dict, Any

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

logger = logging.getLogger(__name__)

DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset", "career_data.csv")

# Key feature columns
FEATURE_COLS = [
    'Major', 'CGPA', 'Programming_Skill', 'Projects_Completed', 'Certifications',
    'Hackathons', 'Internships', 'Resume_Score', 'Communication_Skills',
    'Teamwork', 'Problem_Solving', 'English_Proficiency', 'Interview_Score',
    'Employability_Score', 'Leadership_Experience'
]


def load_dataset(path: str = DATASET_PATH) -> pd.DataFrame:
    df = pd.read_csv(path)
    logger.info("Loaded dataset: %d rows × %d cols", *df.shape)
    return df


def preprocess(
    path: str = DATASET_PATH,
    test_size: float = 0.2,
    random_state: int = 42,
):
    """
    Load and preprocess the dataset.
    Returns:
        X_train, X_test, y_train, y_test, feature_names, label_encoder, scaler, training_columns
    """
    df = load_dataset(path)

    # Determine target column
    target_col = "Career_Field" if "Career_Field" in df.columns else "career"

    # Filter out unplaced or non-target rows if applicable
    if target_col in df.columns:
        df = df[df[target_col] != "Not Placed"].copy()

    # Drop duplicates
    df.drop_duplicates(inplace=True)

    # Encode target
    le = LabelEncoder()
    y = le.fit_transform(df[target_col])

    # Select features
    avail_features = [c for c in FEATURE_COLS if c in df.columns]
    if not avail_features:
        avail_features = [c for c in df.columns if c not in [target_col, "Student_ID", "Placement_Status", "Company_Tier", "Placement_Mode", "Starting_Salary_USD", "interests"]]

    X_df = df[avail_features].copy()

    # One-hot encode categorical features
    X_encoded = pd.get_dummies(X_df, drop_first=True)
    training_columns = list(X_encoded.columns)

    # Scale numeric data
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_encoded.fillna(0))

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=test_size, random_state=random_state, stratify=y
    )

    logger.info(
        "Preprocessed split: train=%d, test=%d, features=%d, classes=%d (%s)",
        len(X_train), len(X_test), len(training_columns), len(le.classes_),
        ", ".join(le.classes_[:5]) + "..."
    )

    return X_train, X_test, y_train, y_test, training_columns, le, scaler


def build_feature_vector(student_data: dict, training_columns: list) -> np.ndarray:
    """
    Convert student profile into a feature vector matching the one-hot encoded training columns.
    """
    # Build a single-row DataFrame with defaults
    row = {}

    # Extract basic metrics from student profile or default to standard averages
    cgpa = float(student_data.get("cgpa") or student_data.get("CGPA") or 8.0)
    prog_skill = float(student_data.get("programming_skill") or student_data.get("Programming_Skill") or student_data.get("python", 75))
    comm_skill = float(student_data.get("communication_skills") or student_data.get("Communication_Skills") or student_data.get("verbal_score", 70))
    prob_solve = float(student_data.get("problem_solving") or student_data.get("Problem_Solving") or student_data.get("logical_score", 80))
    interview = float(student_data.get("interview_score") or student_data.get("Interview_Score") or 75)
    employability = float(student_data.get("employability_score") or student_data.get("Employability_Score") or 80)
    projects = float(student_data.get("projects_completed") or student_data.get("Projects_Completed") or 3)
    certs = float(student_data.get("certifications") or student_data.get("Certifications") or 2)
    hackathons = float(student_data.get("hackathons") or student_data.get("Hackathons") or 1)
    internships = float(student_data.get("internships") or student_data.get("Internships") or 1)
    resume_score = float(student_data.get("resume_score") or student_data.get("Resume_Score") or 85)
    teamwork = float(student_data.get("teamwork") or student_data.get("Teamwork") or 80)

    student_major = str(student_data.get("branch") or student_data.get("major") or student_data.get("Major") or "Computer Science")

    # Map features
    sample_df = pd.DataFrame([{
        'CGPA': cgpa,
        'Programming_Skill': prog_skill,
        'Projects_Completed': projects,
        'Certifications': certs,
        'Hackathons': hackathons,
        'Internships': internships,
        'Resume_Score': resume_score,
        'Communication_Skills': comm_skill,
        'Teamwork': teamwork,
        'Problem_Solving': prob_solve,
        'Interview_Score': interview,
        'Employability_Score': employability,
        'Major': student_major,
        'Leadership_Experience': 'Yes' if certs > 1 or projects > 2 else 'No',
        'English_Proficiency': 'Advanced' if comm_skill > 60 else 'Intermediate',
    }])

    # One-hot encode and reindex to exactly match training columns
    sample_encoded = pd.get_dummies(sample_df)
    sample_encoded = sample_encoded.reindex(columns=training_columns, fill_value=0)

    return sample_encoded.values
