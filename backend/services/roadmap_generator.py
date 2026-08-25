"""
roadmap_generator.py — Build a month-by-month learning roadmap.
Uses rule-based milestone scaffolding, then enhances with OpenAI.
"""
import json
import logging
import os
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


# ── Static roadmap templates per career ─────────────────────────────────────

TEMPLATES: Dict[str, List[Dict]] = {
    "Data Scientist": [
        {"month": 1, "title": "Python & Statistics Foundations", "tasks": ["Complete Python for Data Science course", "Study descriptive & inferential statistics", "Practice NumPy and Pandas"]},
        {"month": 2, "title": "Data Wrangling & Visualization", "tasks": ["Master Pandas data cleaning", "Build 3 Matplotlib/Seaborn visualizations", "Explore a real-world dataset on Kaggle"]},
        {"month": 3, "title": "Machine Learning Basics", "tasks": ["Study Scikit-Learn: regression, classification, clustering", "Build a predictive model project", "Learn model evaluation metrics"]},
        {"month": 4, "title": "Advanced ML & SQL", "tasks": ["Study ensemble methods (Random Forest, XGBoost)", "Complete SQL for Data Analysis", "Work on an end-to-end Kaggle competition"]},
        {"month": 5, "title": "Deep Learning & NLP", "tasks": ["Introduction to neural networks with TensorFlow/Keras", "Text classification mini-project", "Deploy a model with Flask"]},
        {"month": 6, "title": "Portfolio & Certification", "tasks": ["Build a capstone Data Science project", "Publish 3 notebooks on Kaggle", "Earn IBM Data Science or Google Data Analytics certificate"]},
    ],
    "Software Engineer": [
        {"month": 1, "title": "Core Programming & DSA", "tasks": ["Master OOP in Python/Java", "Study arrays, linked lists, stacks, queues", "Solve 30 LeetCode Easy problems"]},
        {"month": 2, "title": "System Design Basics", "tasks": ["Study databases: SQL joins, indexing", "Learn REST API design principles", "Build a simple CRUD API"]},
        {"month": 3, "title": "Web Backend Development", "tasks": ["Build a full REST API with Flask/Spring", "Integrate MySQL with SQLAlchemy/JPA", "Write unit tests with pytest/JUnit"]},
        {"month": 4, "title": "Advanced DSA & Interviews", "tasks": ["Study trees, graphs, dynamic programming", "Solve 40 LeetCode Medium problems", "Do 5 mock technical interviews"]},
        {"month": 5, "title": "Cloud & DevOps Basics", "tasks": ["Deploy application to AWS EC2/Heroku", "Learn Docker basics", "Set up a CI/CD pipeline with GitHub Actions"]},
        {"month": 6, "title": "Capstone & Job Applications", "tasks": ["Build a portfolio project (full-stack app)", "Contribute to 2 open-source repos", "Apply to 20 SWE positions"]},
    ],
    "Web Developer": [
        {"month": 1, "title": "HTML, CSS & JavaScript", "tasks": ["Master HTML5 semantic elements", "CSS Flexbox, Grid, responsive design", "JavaScript ES6+ fundamentals"]},
        {"month": 2, "title": "React.js Fundamentals", "tasks": ["Components, props, state, hooks", "Build a React To-Do app", "React Router and Context API"]},
        {"month": 3, "title": "Backend with Node.js", "tasks": ["Node.js + Express REST API", "MongoDB integration with Mongoose", "JWT authentication implementation"]},
        {"month": 4, "title": "Full Stack Integration", "tasks": ["Connect React frontend to Express backend", "Deploy on Vercel + Railway", "Add real-time features with Socket.io"]},
        {"month": 5, "title": "Performance & SEO", "tasks": ["Lighthouse audit and optimization", "Lazy loading, code splitting", "SEO meta tags, Open Graph"]},
        {"month": 6, "title": "Portfolio Launch", "tasks": ["Build 3 polished portfolio projects", "Create personal portfolio website", "Apply to 15 frontend/full-stack roles"]},
    ],
    "Cloud Engineer": [
        {"month": 1, "title": "Cloud Fundamentals", "tasks": ["AWS Cloud Practitioner Essentials course", "Understand IaaS, PaaS, SaaS", "Create AWS free-tier account and explore services"]},
        {"month": 2, "title": "Core AWS Services", "tasks": ["EC2, S3, RDS, VPC hands-on", "IAM roles and policies", "Complete AWS Solutions Architect practice labs"]},
        {"month": 3, "title": "Containers & Orchestration", "tasks": ["Docker: build and run containers", "Kubernetes: pods, deployments, services", "Deploy app on EKS/GKE"]},
        {"month": 4, "title": "Infrastructure as Code", "tasks": ["Terraform: write, plan, apply", "CloudFormation basics", "Automate multi-region deployment"]},
        {"month": 5, "title": "CI/CD & Monitoring", "tasks": ["GitHub Actions pipeline for cloud deployment", "AWS CloudWatch, Grafana dashboards", "Security: WAF, Shield, IAM best practices"]},
        {"month": 6, "title": "Certification Sprint", "tasks": ["Take AWS Solutions Architect Associate exam", "Build a highly available cloud architecture project", "Document architecture with diagrams"]},
    ],
    "AI/ML Engineer": [
        {"month": 1, "title": "Mathematical Foundations", "tasks": ["Linear algebra and calculus for ML", "Probability and statistics review", "Python scientific computing (NumPy, SciPy)"]},
        {"month": 2, "title": "Classical Machine Learning", "tasks": ["All Scikit-Learn algorithms", "Feature engineering and selection", "Model evaluation: cross-validation, ROC, F1"]},
        {"month": 3, "title": "Deep Learning Foundations", "tasks": ["Neural networks from scratch (backprop)", "TensorFlow/Keras: CNNs and RNNs", "Image classification project"]},
        {"month": 4, "title": "Advanced Deep Learning", "tasks": ["Transformers and attention mechanisms", "Hugging Face NLP fine-tuning", "LLM prompt engineering basics"]},
        {"month": 5, "title": "MLOps & Production", "tasks": ["MLflow experiment tracking", "FastAPI model serving", "Docker + Kubernetes model deployment", "CI/CD for ML pipelines"]},
        {"month": 6, "title": "Research & Certification", "tasks": ["Implement a paper from arXiv", "TensorFlow Developer Certificate", "Publish work on GitHub/Kaggle", "Apply to AI/ML Engineer roles"]},
    ],
    "Cybersecurity Analyst": [
        {"month": 1, "title": "Networking & OS Fundamentals", "tasks": ["OSI model, TCP/IP, DNS, HTTP", "Linux command line proficiency", "Wireshark packet analysis lab"]},
        {"month": 2, "title": "Security Principles", "tasks": ["CIA triad, authentication, encryption", "CompTIA Security+ study guide", "Hash functions and PKI basics"]},
        {"month": 3, "title": "Ethical Hacking Basics", "tasks": ["Kali Linux setup and tools", "OWASP Top 10 vulnerabilities", "Bug bounty starter: HackTheBox / TryHackMe"]},
        {"month": 4, "title": "SOC & Incident Response", "tasks": ["SIEM tools: Splunk basics", "Incident response playbooks", "Log analysis and threat hunting"]},
        {"month": 5, "title": "Advanced Pen Testing", "tasks": ["Web application penetration testing", "Metasploit framework", "Write 3 CVE-based vulnerability reports"]},
        {"month": 6, "title": "Certification & Portfolio", "tasks": ["CompTIA Security+ or CEH exam", "Complete 10 TryHackMe/HTB machines", "Build CTF write-up blog"]},
    ],
    "Data Analyst": [
        {"month": 1, "title": "Excel & SQL Mastery", "tasks": ["Excel: pivot tables, VLOOKUP, Power Query", "SQL: joins, aggregations, window functions", "Practice on real datasets"]},
        {"month": 2, "title": "Python for Analysis", "tasks": ["Pandas: data cleaning and transformation", "Matplotlib and Seaborn visualizations", "Exploratory Data Analysis (EDA) project"]},
        {"month": 3, "title": "Business Intelligence Tools", "tasks": ["Tableau: dashboards and calculated fields", "Power BI: DAX basics, reports", "Build an executive dashboard"]},
        {"month": 4, "title": "Statistics & A/B Testing", "tasks": ["Hypothesis testing, p-values, confidence intervals", "A/B test design and analysis", "Regression analysis in Python"]},
        {"month": 5, "title": "Advanced Analytics", "tasks": ["Google Analytics 4 basics", "SQL advanced: CTEs, stored procedures", "Build an automated reporting pipeline"]},
        {"month": 6, "title": "Portfolio & Certification", "tasks": ["Google Data Analytics Certificate exam", "Publish 3 Tableau Public dashboards", "Present analysis findings in PowerPoint"]},
    ],
    "DevOps Engineer": [
        {"month": 1, "title": "Linux & Scripting", "tasks": ["Linux administration: users, permissions, processes", "Bash scripting for automation", "Python scripting for system tasks"]},
        {"month": 2, "title": "Version Control & CI/CD", "tasks": ["Git advanced: branching, rebasing, hooks", "GitHub Actions: build, test, deploy pipeline", "Jenkins: freestyle and pipeline jobs"]},
        {"month": 3, "title": "Containers", "tasks": ["Docker: Dockerfile, compose, networking", "Container security best practices", "Push images to Docker Hub / ECR"]},
        {"month": 4, "title": "Kubernetes", "tasks": ["K8s: pods, services, deployments, namespaces", "Helm charts", "CKA exam practice labs"]},
        {"month": 5, "title": "Infrastructure as Code & Monitoring", "tasks": ["Terraform modules and state management", "Prometheus + Grafana monitoring stack", "ELK stack log aggregation"]},
        {"month": 6, "title": "Cloud & Certification", "tasks": ["AWS/Azure/GCP deployment hands-on", "CKA or AWS DevOps Professional exam", "Build a fully automated cloud deployment demo"]},
    ],
    "Database Administrator": [
        {"month": 1, "title": "Relational Database Mastery", "tasks": ["MySQL/PostgreSQL administration", "Schema design, normalization", "CRUD operations and stored procedures"]},
        {"month": 2, "title": "Performance Tuning", "tasks": ["Index design and query optimization", "EXPLAIN plan analysis", "Buffer pool and cache tuning"]},
        {"month": 3, "title": "Backup & Recovery", "tasks": ["Full, incremental, differential backups", "Point-in-time recovery", "Replication setup (master-slave)"]},
        {"month": 4, "title": "NoSQL Databases", "tasks": ["MongoDB: collections, aggregation pipelines", "Redis: caching patterns", "When to use SQL vs NoSQL"]},
        {"month": 5, "title": "Cloud Databases", "tasks": ["AWS RDS and Aurora", "PlanetScale / Supabase", "Database migration strategies"]},
        {"month": 6, "title": "Certification", "tasks": ["Oracle Database Foundations or PostgreSQL DBA cert", "Automated backup/monitoring setup project", "Apply to DBA roles"]},
    ],
    "Product Manager": [
        {"month": 1, "title": "PM Fundamentals", "tasks": ["Read: Inspired by Marty Cagan", "Study Agile/Scrum methodology", "Create a user persona and journey map"]},
        {"month": 2, "title": "Product Discovery", "tasks": ["User interviews and survey design", "JTBD (Jobs to be Done) framework", "Opportunity solution tree"]},
        {"month": 3, "title": "Product Metrics & Analytics", "tasks": ["North Star Metric, AARRR framework", "Google Analytics / Mixpanel basics", "Build a metrics dashboard"]},
        {"month": 4, "title": "Roadmapping & Prioritization", "tasks": ["RICE, Kano, MoSCoW frameworks", "Build a 6-month product roadmap", "Stakeholder presentation (10 min)"]},
        {"month": 5, "title": "Technical PM Skills", "tasks": ["API concepts and reading technical docs", "SQL for PMs: basic data queries", "A/B testing fundamentals"]},
        {"month": 6, "title": "Portfolio & Job Search", "tasks": ["Write 3 PM case studies", "Practice PM interviews (product sense, metrics)", "Apply to Associate PM / PM roles"]},
    ],
}


def _build_template(career_title: str, gap_analysis: Dict) -> List[Dict]:
    """Return month-by-month template, falling back to a generic one."""
    gap_skills = [g["skill"] for g in gap_analysis.get("gaps", [])]

    template = TEMPLATES.get(career_title)
    if not template:
        # Generic fallback
        template = [
            {"month": 1, "title": "Foundations", "tasks": ["Identify key skills for this career", "Enroll in a foundational course", f"Study: {gap_skills[0] if gap_skills else 'core skills'}"]},
            {"month": 2, "title": "Core Skills", "tasks": ["Complete foundational course", "Build first mini-project", f"Explore: {gap_skills[1] if len(gap_skills) > 1 else 'advanced topics'}"]},
            {"month": 3, "title": "Applied Practice", "tasks": ["Work on a real-world project", "Join relevant online communities", "Get peer feedback"]},
            {"month": 4, "title": "Advanced Topics", "tasks": ["Deep-dive into specialized skills", "Contribute to open-source or portfolio", "Start interview preparation"]},
            {"month": 5, "title": "Portfolio Building", "tasks": ["Complete 2 showcase projects", "Update LinkedIn and GitHub", "Network with professionals in the field"]},
            {"month": 6, "title": "Certification & Job Hunt", "tasks": ["Earn a relevant certification", "Apply to 15+ positions", "Schedule mock interviews"]},
        ]

    return template


def _enhance_with_openai(
    career_title: str,
    student_name: str,
    gap_analysis: Dict,
    milestones: List[Dict],
    api_key: str,
) -> str:
    """Use OpenAI to generate a personalized roadmap summary."""
    try:
        import os
        # Remove any invalid proxy env var that causes Client.__init__() error
        os.environ.pop("HTTP_PROXY", None)
        os.environ.pop("HTTPS_PROXY", None)
        os.environ.pop("http_proxy", None)
        os.environ.pop("https_proxy", None)
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        gap_text = gap_analysis.get("gap_statement", "")
        gaps = [g["skill"] for g in gap_analysis.get("gaps", [])[:5]]

        prompt = (
            f"You are a career advisor. Write a 3-paragraph personalized career roadmap summary "
            f"for {student_name or 'the student'} who wants to become a {career_title}. "
            f"Their skill gaps are: {', '.join(gaps) if gaps else 'minimal'}. "
            f"Gap statement: {gap_text}. "
            f"Be encouraging, specific, and actionable. Keep it under 200 words."
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        logger.warning("OpenAI roadmap enhancement failed: %s", e)
        return (
            f"Your personalized {career_title} roadmap is ready! "
            f"This 6-month plan is designed to close your skill gaps and build "
            f"a strong, job-ready profile. Follow each milestone consistently and "
            f"track your progress on the dashboard."
        )


def generate_roadmap(
    student_id: int,
    student_name: str,
    career_title: str,
    gap_analysis: Dict,
    recommendations: Dict,
    openai_api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate and persist a full roadmap for a student.
    Returns roadmap dict (not saved to DB here — route handles persistence).
    """
    milestones_raw = _build_template(career_title, gap_analysis)
    courses = recommendations.get("courses", [])
    certs = recommendations.get("certifications", [])

    # Distribute courses across months
    courses_per_month = max(1, len(courses) // len(milestones_raw))
    certs_per_month = max(1, len(certs) // len(milestones_raw))

    milestones = []
    for i, m in enumerate(milestones_raw):
        month_courses = courses[i * courses_per_month: (i + 1) * courses_per_month]
        month_certs = certs[i * certs_per_month: (i + 1) * certs_per_month] if i == len(milestones_raw) - 1 else []

        milestones.append({
            "month": m["month"],
            "title": m["title"],
            "description": f"Month {m['month']} focus for your {career_title} journey.",
            "tasks": m.get("tasks", []),
            "courses": month_courses,
            "certifications": month_certs,
            "is_completed": False,
        })

    # OpenAI summary
    api_key = openai_api_key or os.environ.get("OPENAI_API_KEY", "")
    summary = _enhance_with_openai(
        career_title, student_name, gap_analysis, milestones, api_key
    )

    return {
        "career_title": career_title,
        "total_months": len(milestones),
        "summary": summary,
        "milestones": milestones,
    }
