"""
resume_parser.py — Extract skills, projects, and certifications from
PDF or DOCX resumes. Flags inconsistencies vs. declared student profile.
"""
import io
import re
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

# ── Keyword libraries ─────────────────────────────────────────────────────────

SKILL_KEYWORDS = {
    "Python", "Java", "JavaScript", "C++", "R", "SQL", "Machine Learning",
    "Deep Learning", "NLP", "TensorFlow", "PyTorch", "Scikit-Learn",
    "Statistics", "Data Visualization", "Pandas", "NumPy", "Tableau",
    "Power BI", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD",
    "Linux", "Terraform", "React", "Node.js", "HTML", "CSS", "REST API",
    "Django", "Flask", "MySQL", "MongoDB", "PostgreSQL", "Cybersecurity",
    "Ethical Hacking", "Network Security", "Git", "GitHub", "Agile", "Scrum",
    "Excel", "MATLAB", "Scala", "Go", "Rust", "Swift", "Kotlin", "TypeScript",
    "Spark", "Hadoop", "Kafka", "Redis", "Elasticsearch", "Jenkins", "Ansible",
}

CERT_PATTERNS = [
    r"AWS\s+Certified[\w\s]+",
    r"Azure\s+[\w\s]+Certificate[\w\s]*",
    r"Google\s+[\w\s]+Certificate[\w\s]*",
    r"GCP\s+[\w\s]+",
    r"TensorFlow\s+Developer",
    r"CISSP",
    r"CompTIA\s+[\w+]+",
    r"CEH",
    r"PMP",
    r"Scrum\s+Master",
    r"Oracle\s+Certified[\w\s]+",
    r"IBM\s+[\w\s]+Certificate[\w\s]*",
    r"NPTEL\s+[\w\s]+",
    r"Coursera\s+[\w\s]+",
    r"Udemy\s+[\w\s]+",
]

PROJECT_SECTION_RE = re.compile(
    r"(?:projects?|work experience|experience|portfolio)[\s\S]{0,2000}?(?=\n(?:education|skills?|certifications?|awards?|publications?|references?)\b|\Z)",
    re.IGNORECASE,
)


def _extract_text_pdf(file_bytes: bytes) -> str:
    try:
        import fitz
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = [page.get_text() for page in doc]
        text = "\n".join(pages).strip()
        if text:
            return text
    except Exception as e:
        logger.warning("PyMuPDF fitz extraction failed: %s", e)

    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        text = "\n".join(pages).strip()
        if text:
            return text
    except Exception as e:
        logger.warning("pdfplumber failed: %s. Trying PyPDF2.", e)

    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages).strip()
    except Exception as e2:
        logger.error("PDF extraction failed: %s", e2)
        return ""


def _extract_text_docx(file_bytes: bytes) -> str:
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e:
        logger.error("DOCX extraction failed: %s", e)
        return ""


def extract_text(file_bytes: bytes, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        return _extract_text_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return _extract_text_docx(file_bytes)
    else:
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""


def extract_skills(text: str) -> List[str]:
    found = set()
    text_upper = text.upper()
    for skill in SKILL_KEYWORDS:
        pattern = r"\b" + re.escape(skill.upper()) + r"\b"
        if re.search(pattern, text_upper):
            found.add(skill)
    return sorted(found)


def extract_certifications(text: str) -> List[str]:
    certs = []
    for pattern in CERT_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        certs.extend([m.strip() for m in matches])
    return list(set(certs))


def extract_projects(text: str) -> List[str]:
    projects = []
    match = PROJECT_SECTION_RE.search(text)
    if match:
        block = match.group()
        # Split on bullet points / new lines starting with caps
        lines = [l.strip() for l in block.split("\n") if len(l.strip()) > 20]
        projects = lines[:10]  # cap at 10
    return projects


def parse_resume(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Parse a resume file and return structured data.
    """
    text = extract_text(file_bytes, filename)
    if not text:
        return {"error": "Could not extract text from resume."}

    skills = extract_skills(text)
    certifications = extract_certifications(text)
    projects = extract_projects(text)

    return {
        "raw_text_length": len(text),
        "skills": skills,
        "certifications": certifications,
        "projects": projects,
    }


def flag_inconsistencies(
    parsed: Dict[str, Any],
    declared_skills: List[str],
) -> Dict[str, Any]:
    """
    Compare parsed resume data to declared profile.
    Returns lists of confirmed, missing (in resume but not declared),
    and extra (declared but not in resume) skills.
    """
    parsed_set = {s.lower() for s in parsed.get("skills", [])}
    declared_set = {s.lower() for s in declared_skills}

    confirmed = sorted(parsed_set & declared_set)
    only_in_resume = sorted(parsed_set - declared_set)
    only_declared = sorted(declared_set - parsed_set)

    return {
        "confirmed_skills": confirmed,
        "skills_in_resume_not_declared": only_in_resume,
        "skills_declared_not_in_resume": only_declared,
        "consistency_score": round(
            len(confirmed) / max(len(declared_set), 1) * 100, 1
        ),
    }
