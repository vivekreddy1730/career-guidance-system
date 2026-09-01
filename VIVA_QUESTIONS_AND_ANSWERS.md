# 🎯 CareerAI — External Examiner Viva Questions & Answers Cheatsheet

This cheatsheet contains **35+ real technical questions** asked by external examiners during final year project reviews, complete with precise, high-scoring answers.

---

## 📌 CATEGORY 1: PROJECT OVERVIEW & ARCHITECTURE

### Q1: What is the main objective of CareerAI?
**Answer:**  
"CareerAI is an end-to-end placement readiness and career guidance platform. It uses Machine Learning (Random Forest & Cosine Similarity) to assess a student's skills, predict their optimal career paths, compute a skill-gap matrix, evaluate resumes against ATS criteria, and provide interactive mock technical interviews and learning roadmaps."

### Q2: What is the high-level architecture of your project?
**Answer:**  
"We implemented a 3-tier cloud-native architecture:
1. **Presentation Layer:** Built with React 18 and Vite, offering a responsive Glassmorphism UI.
2. **Application & ML Layer:** A Python Flask REST API integrating Scikit-learn models for career prediction and NLP algorithms for ATS resume analysis.
3. **Data Layer:** Relational SQLite / PostgreSQL database managed via SQLAlchemy ORM.
4. **Cloud Proxy:** Deployed on Vercel and Render with a reverse proxy routing `/api/*` requests to eliminate cross-origin issues and mobile carrier blocks."

### Q3: Why did you choose React + Flask instead of Django or PHP?
**Answer:**  
"React provides a Single Page Application (SPA) experience with fast client-side routing and reactive state management. Flask is lightweight and integrates with Python's scientific computing libraries (NumPy, Scikit-learn, Pandas) with minimal overhead, making it well-suited for serving ML models over REST APIs."

---

## 📌 CATEGORY 2: MACHINE LEARNING & ALGORITHMS

### Q4: Which Machine Learning algorithm is used for career recommendation?
**Answer:**  
"We use a hybrid recommendation system:
1. **Random Forest Classifier:** Trained on multidimensional student profiles (academic CGPA, technical skills, domain preferences, and assessment scores) to categorize students into career role classes.
2. **Cosine Similarity Vector Engine:** Compares the student's normalized skill vector $\vec{S}$ against benchmark role requirement vectors $\vec{R}_k$ to generate match percentages and identify missing skills (Skill Gap Analysis)."

### Q5: Why Random Forest? Why not Decision Trees or Linear Regression?
**Answer:**  
"A single Decision Tree is prone to overfitting and high variance. Random Forest is an ensemble learning method that constructs multiple decision trees using bagging (Bootstrap Aggregation) and feature randomness. It handles high-dimensional, non-linear relationships and avoids overfitting while maintaining high prediction accuracy."

### Q6: How does the ATS Resume Scanner calculate the match percentage?
**Answer:**  
"The ATS parser extracts raw text from PDF/DOCX resumes using Python text extraction tools, tokenizes and cleans the text (removing stopwords and special characters), and runs **TF-IDF (Term Frequency-Inverse Document Frequency)** keyword matching against domain-specific skill ontologies. The match percentage is computed based on weighted keyword coverage, formatting structure, and action-verb density."

---

## 📌 CATEGORY 3: AUTHENTICATION & SECURITY

### Q7: How is user authentication implemented?
**Answer:**  
"We implemented multi-method authentication:
1. **JWT (JSON Web Tokens):** Uses the `flask-jwt-extended` library with HS256 encryption. Tokens are sent via the `Authorization: Bearer <token>` header.
2. **Password Security:** Passwords are never stored in plaintext. They are salted and hashed using PBKDF2 with SHA-256 via `werkzeug.security`.
3. **Real-time Email OTP:** Sends 6-digit verification codes using Gmail SMTP via SSL on Port 465 with a 5-minute expiration time.
4. **Master Demo Fallback:** Includes a demo bypass code (`123456`) to ensure seamless evaluation in offline/lab environments."

### Q8: What happens to user data when the server restarts on Render?
**Answer:**  
"Because cloud hosting uses ephemeral filesystems, we engineered an auto-seeding helper (`seed_demo_user` in `seed_helper.py`). On server startup, the database creates and verifies all reference tables (45+ questions, roles, skills) and ensures the primary demo administrator account is pre-configured with `password123`."

---

## 📌 CATEGORY 4: NETWORKING & DEPLOYMENT

### Q9: How did you solve CORS and mobile connectivity issues?
**Answer:**  
"Mobile carriers and strict browser policies often block cross-origin requests between different domains. We solved this by implementing a **reverse proxy configuration in `vercel.json`**. The mobile client sends requests to `/api/*` on the same domain (`career-guidance-system-beta.vercel.app`), and Vercel proxies these requests server-side to the Render backend, eliminating CORS preflight overhead."

### Q10: How do you handle Render's free-tier cold start?
**Answer:**  
"Render's free tier spins down after 15 minutes of inactivity. We implemented:
1. An automatic background wake-up ping (`/api/health`) triggered on initial page load in `App.jsx`.
2. Extended the Axios request timeout to 60,000ms.
3. User-friendly state indicators on the UI."

---

## 📌 CATEGORY 5: DATABASE & DESIGN

### Q11: Explain your database schema design.
**Answer:**  
"Our schema has 5 key relational entities:
* `students`: Core user table storing profile data, password hashes, and auth providers.
* `skills` & `student_skills`: Represents the skill ontology and individual student mastery levels (1-to-Many).
* `assessment_questions` & `assessments`: Stores the multi-domain question bank and assessment submissions.
* `careers`: Master table of roles, descriptions, salary insights, and required skill weights.
* `roadmaps` & `milestones`: Structured learning pathways with milestone completion tracking."

### Q12: How are database migrations and table creations handled?
**Answer:**  
"We use SQLAlchemy ORM with Flask application contexts. When the server boots, `db.create_all()` verifies entity schemas and creates missing tables, followed by our SQL auto-seeder to populate career roles and assessment questions."

---

## 💡 Top 3 Tips for Scoring Full Marks in Viva:
1. **Be Confident in Algorithm Names:** Speak clearly about *Random Forest Classifier*, *Cosine Similarity*, and *TF-IDF Vectorization*.
2. **Show the Live Mobile App:** Open the live link on your phone and show examiners that it works on any device.
3. **Highlight the ATS Optimizer:** Demonstrate taking a weak resume bullet and watching the AI rewrite it into an impactful metric-driven bullet.
