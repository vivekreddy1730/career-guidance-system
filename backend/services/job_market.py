"""
job_market.py — Fetch live job listings and trending skills data.
Reads from local Kaggle datasets (job_postings.csv & salaries.csv) and external APIs.
"""
import os
import logging
import requests
import pandas as pd
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs"
JSEARCH_BASE = "https://jsearch.p.rapidapi.com/search"

DATASET_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "dataset")
JOB_POSTINGS_CSV = os.path.join(DATASET_DIR, "job_postings.csv")
SALARIES_CSV = os.path.join(DATASET_DIR, "salaries.csv")

TRENDING_SKILLS = [
    {"skill": "Generative AI", "demand": 94, "growth": "+165%", "color": "#6366f1"},
    {"skill": "Machine Learning", "demand": 90, "growth": "+78%", "color": "#8b5cf6"},
    {"skill": "Cloud Computing (AWS/GCP)", "demand": 88, "growth": "+62%", "color": "#0ea5e9"},
    {"skill": "Data Analytics & SQL", "demand": 86, "growth": "+58%", "color": "#10b981"},
    {"skill": "Cybersecurity", "demand": 83, "growth": "+55%", "color": "#f59e0b"},
    {"skill": "DevOps & Kubernetes", "demand": 80, "growth": "+48%", "color": "#ef4444"},
    {"skill": "Full Stack Dev (React/Node)", "demand": 78, "growth": "+38%", "color": "#ec4899"},
    {"skill": "Deep Learning / PyTorch", "demand": 76, "growth": "+44%", "color": "#06b6d4"},
]


def _get_dataset_jobs(query: str, limit: int = 10) -> List[Dict]:
    """Retrieve jobs matching the title from local job_postings.csv."""
    if not os.path.exists(JOB_POSTINGS_CSV):
        return []

    try:
        df = pd.read_csv(JOB_POSTINGS_CSV)
        # Search by title or description
        terms = [q.lower() for q in query.split() if len(q) > 2]
        
        def match_row(row):
            text = f"{str(row.get('title', ''))} {str(row.get('description', ''))}".lower()
            return any(t in text for t in terms)

        matched = df[df.apply(match_row, axis=1)]
        if matched.empty:
            matched = df.head(limit)

        jobs = []
        for _, r in matched.head(limit).iterrows():
            jobs.append({
                "title": str(r.get("title", query)),
                "company": str(r.get("company", "Tech Global")),
                "location": str(r.get("location", "Bangalore / Remote")),
                "salary_min": 750000,
                "salary_max": 1600000,
                "description": str(r.get("description", ""))[:300] + "...",
                "url": str(r.get("link", "https://www.linkedin.com/jobs/")),
                "created": str(r.get("date_posted", "Recent")),
                "source": "kaggle_linkedin",
            })
        return jobs
    except Exception as e:
        logger.warning("Dataset job read failed: %s", e)
        return []


def _get_adzuna_jobs(query: str, country: str, app_id: str, api_key: str, page: int = 1) -> List[Dict]:
    try:
        url = f"{ADZUNA_BASE}/{country}/search/{page}"
        params = {
            "app_id": app_id,
            "app_key": api_key,
            "what": query,
            "content-type": "application/json",
            "results_per_page": 10,
            "sort_by": "relevance",
        }
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        jobs = []
        for j in data.get("results", []):
            jobs.append({
                "title": j.get("title", ""),
                "company": j.get("company", {}).get("display_name", "N/A"),
                "location": j.get("location", {}).get("display_name", "N/A"),
                "salary_min": j.get("salary_min"),
                "salary_max": j.get("salary_max"),
                "description": j.get("description", "")[:300],
                "url": j.get("redirect_url", "#"),
                "created": j.get("created", ""),
                "source": "adzuna",
            })
        return jobs
    except Exception as e:
        logger.warning("Adzuna API error: %s", e)
        return []


def fetch_jobs(
    career_title: str,
    adzuna_app_id: str = "",
    adzuna_api_key: str = "",
    jsearch_api_key: str = "",
    country: str = "in",
) -> Dict[str, Any]:
    query = career_title

    # 1. Try Adzuna if configured
    if adzuna_app_id and adzuna_api_key:
        jobs = _get_adzuna_jobs(query, country, adzuna_app_id, adzuna_api_key)
        if jobs:
            return {"jobs": jobs, "source": "adzuna", "total": len(jobs)}

    # 2. Try real dataset jobs
    ds_jobs = _get_dataset_jobs(query)
    if ds_jobs:
        return {"jobs": ds_jobs, "source": "linkedin_dataset", "total": len(ds_jobs)}

    # 3. Default fallback
    return {
        "jobs": [
            {
                "title": f"{query} at InnovateX",
                "company": "InnovateX Tech Solutions",
                "location": "Hyderabad, India",
                "salary_min": 850000,
                "salary_max": 1800000,
                "description": f"Hiring for high-impact {query} position.",
                "url": "https://www.linkedin.com/jobs/",
                "created": "2025-01-01",
                "source": "mock",
            }
        ],
        "source": "mock",
        "total": 1,
    }


def get_trending_skills() -> List[Dict]:
    return TRENDING_SKILLS


def get_salary_insights(career_title: str) -> Dict[str, Any]:
    """Return salary ranges calculated from salaries.csv or benchmarks."""
    if os.path.exists(SALARIES_CSV):
        try:
            df = pd.read_csv(SALARIES_CSV)
            terms = [q.lower() for q in career_title.split() if len(q) > 2]
            
            def match_title(t):
                t_str = str(t).lower()
                return any(term in t_str for term in terms)

            matched = df[df['job_title'].apply(match_title)]
            if not matched.empty and 'annual_salary_usd' in matched.columns:
                usd_to_inr = 85.0
                mean_usd = matched['annual_salary_usd'].mean()
                min_usd = matched['annual_salary_usd'].min()
                max_usd = matched['annual_salary_usd'].max()

                return {
                    "min": int(min_usd * usd_to_inr * 0.4),   # Normalized for Indian entry/mid market
                    "max": int(max_usd * usd_to_inr * 0.4),
                    "avg": int(mean_usd * usd_to_inr * 0.4),
                    "currency": "INR",
                    "career": career_title,
                    "sample_size": len(matched),
                }
        except Exception as e:
            logger.warning("Salary dataset computation warning: %s", e)

    benchmarks = {
        "Data Scientist": {"min": 800000, "max": 2200000, "avg": 1350000},
        "Software Engineer": {"min": 650000, "max": 1900000, "avg": 950000},
        "Web Developer": {"min": 450000, "max": 1300000, "avg": 750000},
        "Cloud Engineer": {"min": 850000, "max": 2400000, "avg": 1250000},
        "AI/ML Engineer": {"min": 1100000, "max": 3200000, "avg": 1550000},
        "Cybersecurity Analyst": {"min": 750000, "max": 2100000, "avg": 1100000},
        "Data Analyst": {"min": 450000, "max": 1500000, "avg": 780000},
        "DevOps Engineer": {"min": 750000, "max": 2300000, "avg": 1200000},
    }
    data = benchmarks.get(career_title, {"min": 600000, "max": 1800000, "avg": 1000000})
    return {**data, "currency": "INR", "career": career_title}
