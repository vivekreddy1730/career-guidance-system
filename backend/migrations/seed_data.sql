-- ============================================================
-- seed_data.sql  — Initial reference data
-- ============================================================

-- ── Skills ───────────────────────────────────────────────────
INSERT IGNORE INTO skills (name, category) VALUES
('Python', 'programming'), ('Java', 'programming'), ('JavaScript', 'programming'),
('C++', 'programming'), ('R', 'programming'), ('SQL', 'data'),
('Machine Learning', 'ai_ml'), ('Deep Learning', 'ai_ml'), ('NLP', 'ai_ml'),
('TensorFlow', 'ai_ml'), ('PyTorch', 'ai_ml'), ('Scikit-Learn', 'ai_ml'),
('Statistics', 'data'), ('Data Visualization', 'data'), ('Pandas', 'data'),
('NumPy', 'data'), ('Tableau', 'data'), ('Power BI', 'data'),
('AWS', 'cloud'), ('Azure', 'cloud'), ('GCP', 'cloud'),
('Docker', 'devops'), ('Kubernetes', 'devops'), ('CI/CD', 'devops'),
('Linux', 'devops'), ('Terraform', 'devops'),
('React', 'web'), ('Node.js', 'web'), ('HTML/CSS', 'web'), ('REST API', 'web'),
('Django', 'web'), ('Flask', 'web'),
('MySQL', 'database'), ('MongoDB', 'database'), ('PostgreSQL', 'database'),
('Cybersecurity', 'security'), ('Ethical Hacking', 'security'), ('Network Security', 'security'),
('Communication', 'soft'), ('Problem Solving', 'soft'), ('Teamwork', 'soft');

-- ── Careers ──────────────────────────────────────────────────
INSERT IGNORE INTO careers (title, description, avg_salary_inr, demand_level, industry, search_keywords) VALUES
('Data Scientist', 'Analyze complex data to derive insights using ML and statistics.', 1200000, 'high', 'Technology', '["data scientist", "machine learning engineer", "data analyst ML"]'),
('Software Engineer', 'Design and build software systems and applications.', 900000, 'high', 'Technology', '["software engineer", "backend developer", "full stack developer"]'),
('Web Developer', 'Build and maintain websites and web applications.', 700000, 'high', 'Technology', '["web developer", "frontend developer", "react developer"]'),
('Cloud Engineer', 'Design and manage cloud infrastructure on AWS/Azure/GCP.', 1100000, 'high', 'Technology', '["cloud engineer", "devops engineer", "site reliability engineer"]'),
('AI/ML Engineer', 'Build and deploy AI and machine learning systems at scale.', 1400000, 'very_high', 'Technology', '["ml engineer", "ai engineer", "deep learning engineer"]'),
('Cybersecurity Analyst', 'Protect systems and networks from digital attacks.', 1000000, 'high', 'Security', '["cybersecurity analyst", "information security", "penetration tester"]'),
('Data Analyst', 'Interpret data and generate insights using BI tools.', 700000, 'high', 'Technology', '["data analyst", "business analyst", "BI analyst"]'),
('DevOps Engineer', 'Bridge development and operations with automation and CI/CD.', 1100000, 'high', 'Technology', '["devops engineer", "platform engineer", "infrastructure engineer"]'),
('Database Administrator', 'Manage and optimise relational and NoSQL databases.', 800000, 'medium', 'Technology', '["database administrator", "DBA", "database engineer"]'),
('Product Manager', 'Define product vision and coordinate cross-functional teams.', 1500000, 'high', 'Business', '["product manager", "product owner", "technical product manager"]');

-- ── Career Required Skills (representative subset) ──────────
-- Data Scientist (id=1)
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 1, id, 95 FROM skills WHERE name IN ('Python','Machine Learning','Statistics','SQL','Data Visualization');
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 1, id, 80 FROM skills WHERE name IN ('Deep Learning','Pandas','NumPy','Scikit-Learn');

-- Software Engineer (id=2)
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 2, id, 90 FROM skills WHERE name IN ('Python','Java','SQL','REST API','Problem Solving');
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 2, id, 70 FROM skills WHERE name IN ('Docker','Linux','MySQL');

-- Web Developer (id=3)
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 3, id, 90 FROM skills WHERE name IN ('JavaScript','React','HTML/CSS','Node.js','REST API');
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 3, id, 70 FROM skills WHERE name IN ('MySQL','MongoDB');

-- Cloud Engineer (id=4)
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 4, id, 90 FROM skills WHERE name IN ('AWS','Docker','Kubernetes','Linux','CI/CD');
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 4, id, 75 FROM skills WHERE name IN ('Python','Terraform','Azure','GCP');

-- AI/ML Engineer (id=5)
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 5, id, 95 FROM skills WHERE name IN ('Python','Machine Learning','Deep Learning','TensorFlow','PyTorch');
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 5, id, 80 FROM skills WHERE name IN ('NLP','Statistics','Docker','SQL');

-- Cybersecurity Analyst (id=6)
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 6, id, 90 FROM skills WHERE name IN ('Cybersecurity','Network Security','Linux','Ethical Hacking');
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 6, id, 70 FROM skills WHERE name IN ('Python','SQL');

-- Data Analyst (id=7)
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 7, id, 90 FROM skills WHERE name IN ('SQL','Excel','Data Visualization','Tableau','Power BI');
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 7, id, 75 FROM skills WHERE name IN ('Python','Statistics','Pandas');

-- DevOps Engineer (id=8)
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 8, id, 90 FROM skills WHERE name IN ('Docker','Kubernetes','CI/CD','Linux','AWS');
INSERT IGNORE INTO career_required_skills (career_id, skill_id, importance)
SELECT 8, id, 75 FROM skills WHERE name IN ('Python','Terraform','GCP');

-- ── Courses ──────────────────────────────────────────────────
INSERT IGNORE INTO courses (title, provider, url, skill_tag, career_id, level, duration_weeks, is_free) VALUES
('Machine Learning Specialization', 'Coursera', 'https://www.coursera.org/specializations/machine-learning-introduction', 'Machine Learning', 1, 'beginner', 11, 0),
('IBM Data Science Professional Certificate', 'Coursera', 'https://www.coursera.org/professional-certificates/ibm-data-science', 'Data Science', 1, 'beginner', 26, 0),
('Python for Data Science and AI', 'Coursera', 'https://www.coursera.org/learn/python-for-applied-data-science-ai', 'Python', 1, 'beginner', 5, 0),
('Deep Learning Specialization', 'Coursera', 'https://www.coursera.org/specializations/deep-learning', 'Deep Learning', 5, 'intermediate', 16, 0),
('TensorFlow Developer Certificate', 'Coursera', 'https://www.coursera.org/professional-certificates/tensorflow-in-practice', 'TensorFlow', 5, 'intermediate', 16, 0),
('AWS Cloud Practitioner Essentials', 'Coursera', 'https://www.coursera.org/learn/aws-cloud-practitioner-essentials', 'AWS', 4, 'beginner', 6, 0),
('Google Cloud Professional Data Engineer', 'Coursera', 'https://www.coursera.org/professional-certificates/gcp-data-engineering', 'GCP', 4, 'advanced', 20, 0),
('The Web Developer Bootcamp', 'Udemy', 'https://www.udemy.com/course/the-web-developer-bootcamp/', 'Web Development', 3, 'beginner', 12, 0),
('React - The Complete Guide', 'Udemy', 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', 'React', 3, 'intermediate', 10, 0),
('Docker & Kubernetes: The Practical Guide', 'Udemy', 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/', 'Docker', 8, 'intermediate', 8, 0),
('Data Structures and Algorithms', 'NPTEL', 'https://nptel.ac.in/courses/106/102/106102064/', 'Problem Solving', 2, 'intermediate', 12, 1),
('Introduction to Cybersecurity', 'edX', 'https://www.edx.org/course/introduction-to-cybersecurity', 'Cybersecurity', 6, 'beginner', 8, 0),
('IBM Cybersecurity Analyst Professional Certificate', 'Coursera', 'https://www.coursera.org/professional-certificates/ibm-cybersecurity-analyst', 'Cybersecurity', 6, 'intermediate', 26, 0),
('Google Data Analytics Certificate', 'Coursera', 'https://www.coursera.org/professional-certificates/google-data-analytics', 'Data Analysis', 7, 'beginner', 26, 0),
('Tableau for Beginners', 'Udemy', 'https://www.udemy.com/course/tableau10/', 'Tableau', 7, 'beginner', 6, 0);

-- ── Certifications ───────────────────────────────────────────
INSERT IGNORE INTO certifications (name, provider, url, career_id, skill_tag, level, cost_usd) VALUES
('AWS Certified Cloud Practitioner', 'Amazon Web Services', 'https://aws.amazon.com/certification/certified-cloud-practitioner/', 4, 'AWS', 'foundational', 100),
('AWS Certified Solutions Architect', 'Amazon Web Services', 'https://aws.amazon.com/certification/certified-solutions-architect-associate/', 4, 'AWS', 'associate', 150),
('Google Professional Data Engineer', 'Google Cloud', 'https://cloud.google.com/certification/data-engineer', 1, 'GCP', 'professional', 200),
('Microsoft Azure Fundamentals AZ-900', 'Microsoft', 'https://learn.microsoft.com/en-us/certifications/azure-fundamentals/', 4, 'Azure', 'foundational', 165),
('TensorFlow Developer Certificate', 'Google', 'https://www.tensorflow.org/certificate', 5, 'TensorFlow', 'associate', 100),
('IBM AI Engineering Professional Certificate', 'IBM', 'https://www.coursera.org/professional-certificates/ai-engineer', 5, 'AI', 'professional', 0),
('Certified Information Systems Security Professional (CISSP)', 'ISC2', 'https://www.isc2.org/certifications/cissp', 6, 'Cybersecurity', 'expert', 699),
('CompTIA Security+', 'CompTIA', 'https://www.comptia.org/certifications/security', 6, 'Cybersecurity', 'associate', 392),
('Certified Ethical Hacker (CEH)', 'EC-Council', 'https://www.eccouncil.org/programs/certified-ethical-hacker-ceh/', 6, 'Ethical Hacking', 'professional', 950),
('Google Data Analytics Certificate', 'Google', 'https://grow.google/certificates/data-analytics/', 7, 'Data Analysis', 'foundational', 0),
('Microsoft Certified: Azure Data Scientist', 'Microsoft', 'https://learn.microsoft.com/en-us/certifications/azure-data-scientist/', 1, 'Azure', 'associate', 165),
('Kubernetes Administrator (CKA)', 'CNCF', 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/', 8, 'Kubernetes', 'professional', 395);

-- ── Assessment Questions ─────────────────────────────────────
-- Aptitude – Logical Reasoning
INSERT IGNORE INTO assessment_questions (section, sub_section, question_text, options, correct_index, difficulty, skill_tag) VALUES
('aptitude', 'logical', 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?',
 '["Yes","No","Cannot determine","Only some"]', 0, 'easy', 'Problem Solving'),
('aptitude', 'logical', 'Find the next number: 2, 6, 12, 20, 30, ?',
 '["42","40","38","44"]', 0, 'medium', 'Problem Solving'),
('aptitude', 'logical', 'A clock shows 3:15. What is the angle between the hour and minute hands?',
 '["7.5°","0°","15°","22.5°"]', 0, 'hard', 'Problem Solving'),
('aptitude', 'logical', 'In a certain code, TIGER is written as QDFHS. How is ELEPHANT written?',
 '["BIBIBKMP","BICOEKMP","BIBOBKMP","BICKBKMP"]', 0, 'medium', 'Problem Solving'),
('aptitude', 'logical', 'Pointing to a man, Meena says "His mother is the only daughter of my mother." How is Meena related to the man?',
 '["Mother","Daughter","Sister","Aunt"]', 0, 'medium', 'Problem Solving'),

-- Aptitude – Quantitative
('aptitude', 'quantitative', 'A train 150 m long passes a bridge 250 m long in 20 seconds. Find the speed of the train (km/h).',
 '["72","60","80","54"]', 0, 'medium', 'Problem Solving'),
('aptitude', 'quantitative', 'The simple interest on Rs 4000 at 10% per annum for 3 years is:',
 '["Rs 1200","Rs 1000","Rs 1500","Rs 800"]', 0, 'easy', 'Problem Solving'),
('aptitude', 'quantitative', 'If a : b = 3 : 4 and b : c = 2 : 3, find a : b : c.',
 '["3:4:6","6:8:12","3:6:4","2:3:4"]', 1, 'medium', 'Problem Solving'),

-- Aptitude – Verbal
('aptitude', 'verbal', 'Choose the word most similar in meaning to GREGARIOUS.',
 '["Solitary","Sociable","Aggressive","Melancholy"]', 1, 'medium', 'Communication'),
('aptitude', 'verbal', 'Identify the grammatically correct sentence.',
 '["He do not know the answer.","He does not know the answer.","He did not knew the answer.","He did not knowed the answer."]', 1, 'easy', 'Communication'),

-- Technical – Python
('technical', 'python', 'What is the output of: print(type([]) is list)?',
 '["True","False","None","Error"]', 0, 'easy', 'Python'),
('technical', 'python', 'Which of the following is a mutable data type in Python?',
 '["tuple","string","list","int"]', 2, 'easy', 'Python'),
('technical', 'python', 'What does the "yield" keyword do in Python?',
 '["Returns a value and terminates function","Creates a generator function","Raises an exception","Imports a module"]', 1, 'medium', 'Python'),
('technical', 'python', 'What is the time complexity of Python list append()?',
 '["O(n)","O(log n)","O(1) amortized","O(n log n)"]', 2, 'medium', 'Python'),
('technical', 'python', 'Which decorator is used to define a class method in Python?',
 '["@staticmethod","@classmethod","@property","@abstractmethod"]', 1, 'medium', 'Python'),

-- Technical – SQL
('technical', 'sql', 'Which SQL clause is used to filter groups?',
 '["WHERE","HAVING","GROUP BY","ORDER BY"]', 1, 'easy', 'SQL'),
('technical', 'sql', 'What does the INNER JOIN return?',
 '["All rows from left table","All rows from right table","Rows with matching values in both tables","All rows from both tables"]', 2, 'easy', 'SQL'),
('technical', 'sql', 'Which of the following is NOT a valid SQL aggregate function?',
 '["COUNT","SUM","CONCAT","AVG"]', 2, 'easy', 'SQL'),

-- Technical – Machine Learning
('technical', 'ml', 'Which algorithm is prone to overfitting on noisy data?',
 '["Random Forest","Decision Tree","Naive Bayes","Linear Regression"]', 1, 'medium', 'Machine Learning'),
('technical', 'ml', 'What does the ROC curve plot?',
 '["Precision vs Recall","True Positive Rate vs False Positive Rate","Loss vs Epochs","Accuracy vs Threshold"]', 1, 'medium', 'Machine Learning'),
('technical', 'ml', 'Which technique reduces variance in a model?',
 '["Boosting","Bagging","Feature Selection","Regularization"]', 1, 'medium', 'Machine Learning'),

-- Technical – Web Dev
('technical', 'web', 'Which HTTP method is idempotent?',
 '["POST","PUT","PATCH","None of the above"]', 1, 'medium', 'REST API'),
('technical', 'web', 'What does CSS "box-model" consist of?',
 '["Margin, Border, Padding, Content","Header, Footer, Body, Sidebar","Head, Body, Script, Style","Width, Height, Color, Font"]', 0, 'easy', 'HTML/CSS'),
('technical', 'web', 'What is the output of: console.log(typeof null)?',
 '["null","undefined","object","string"]', 2, 'medium', 'JavaScript'),

-- Technical – Cloud
('technical', 'cloud', 'Which AWS service is used for object storage?',
 '["EC2","RDS","S3","Lambda"]', 2, 'easy', 'AWS'),
('technical', 'cloud', 'What is a Kubernetes Pod?',
 '["A cluster node","The smallest deployable unit containing one or more containers","A service mesh","A load balancer"]', 1, 'medium', 'Kubernetes'),

-- Technical – Data Structures
('technical', 'ds_algo', 'What is the worst-case time complexity of QuickSort?',
 '["O(n log n)","O(n)","O(n²)","O(log n)"]', 2, 'medium', 'Problem Solving'),
('technical', 'ds_algo', 'Which data structure uses LIFO ordering?',
 '["Queue","Stack","Heap","Graph"]', 1, 'easy', 'Problem Solving');
