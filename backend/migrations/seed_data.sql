-- ============================================================
-- seed_data.sql  — Initial reference data (Skills, Careers, Courses, Certs, Questions)
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
('Data Scientist', 'Analyze complex data to derive insights using ML and statistics.', 1480000, 'high', 'Technology', '["data scientist", "machine learning engineer", "data analyst ML"]'),
('Software Engineer', 'Design and build software systems, microservices, and applications.', 1350000, 'high', 'Technology', '["software engineer", "backend developer", "full stack developer"]'),
('Web Developer', 'Build and maintain websites and modern interactive web applications.', 920000, 'high', 'Technology', '["web developer", "frontend developer", "react developer"]'),
('Cloud Engineer', 'Design and manage scalable cloud infrastructure on AWS/Azure/GCP.', 1500000, 'high', 'Technology', '["cloud engineer", "devops engineer", "site reliability engineer"]'),
('AI/ML Engineer', 'Build and deploy deep learning, LLMs, and AI pipelines at scale.', 1820000, 'very_high', 'Technology', '["ml engineer", "ai engineer", "deep learning engineer"]'),
('Cybersecurity Analyst', 'Protect enterprise systems, cloud assets, and networks from digital threats.', 1380000, 'high', 'Security', '["cybersecurity analyst", "information security", "penetration tester"]'),
('Data Analyst', 'Interpret structured data and generate visual executive insights using BI tools.', 860000, 'high', 'Technology', '["data analyst", "business analyst", "BI analyst"]'),
('DevOps Engineer', 'Automate CI/CD pipelines, container orchestration, and system reliability.', 1540000, 'high', 'Technology', '["devops engineer", "platform engineer", "infrastructure engineer"]');

-- ── Assessment Questions (Comprehensive 60+ Question Bank) ──
INSERT IGNORE INTO assessment_questions (section, sub_section, question_text, options, correct_index, difficulty, skill_tag) VALUES
-- Logical Reasoning
('aptitude', 'logical', 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?', '["Yes, absolutely","No","Cannot determine","Only some"]', 0, 'easy', 'Problem Solving'),
('aptitude', 'logical', 'Find the next number in sequence: 2, 6, 12, 20, 30, ?', '["42","40","38","44"]', 0, 'medium', 'Problem Solving'),
('aptitude', 'logical', 'A clock shows 3:15. What is the angle between the hour and minute hands?', '["7.5°","0°","15°","22.5°"]', 0, 'hard', 'Problem Solving'),
('aptitude', 'logical', 'In a certain code, TIGER is written as QDFHS. How is ELEPHANT written?', '["BIBIBKMP","BICOEKMP","BIBOBKMP","BICKBKMP"]', 0, 'medium', 'Problem Solving'),
('aptitude', 'logical', 'Pointing to a man, Meena says "His mother is the only daughter of my mother." How is Meena related to the man?', '["Mother","Daughter","Sister","Aunt"]', 0, 'medium', 'Problem Solving'),
('aptitude', 'logical', 'Statements: Some pens are books. All books are papers. Conclusion: Some pens are papers.', '["Definitely True","Definitely False","Cannot be determined","Partially False"]', 0, 'easy', 'Problem Solving'),
('aptitude', 'logical', 'Look at the series: 36, 34, 30, 28, 24, ? What number should come next?', '["22","26","20","23"]', 0, 'medium', 'Problem Solving'),

-- Quantitative Aptitude
('aptitude', 'quantitative', 'A train 150 m long passes a bridge 250 m long in 20 seconds. Find the speed of the train (km/h).', '["72 km/h","60 km/h","80 km/h","54 km/h"]', 0, 'medium', 'Problem Solving'),
('aptitude', 'quantitative', 'The simple interest on Rs 4000 at 10% per annum for 3 years is:', '["Rs 1200","Rs 1000","Rs 1500","Rs 800"]', 0, 'easy', 'Problem Solving'),
('aptitude', 'quantitative', 'If a : b = 3 : 4 and b : c = 2 : 3, find a : b : c.', '["6:8:12 (3:4:6)","3:4:5","3:6:4","2:3:4"]', 0, 'medium', 'Problem Solving'),
('aptitude', 'quantitative', 'A shopkeeper sells an article at 20% profit. If cost price is Rs 500, what is the selling price?', '["Rs 600","Rs 550","Rs 620","Rs 580"]', 0, 'easy', 'Problem Solving'),
('aptitude', 'quantitative', 'A and B together can complete a work in 12 days. A alone can do it in 20 days. In how many days can B alone complete it?', '["30 days","25 days","28 days","32 days"]', 0, 'medium', 'Problem Solving'),
('aptitude', 'quantitative', 'What is the probability of getting a sum of 7 when two standard dice are rolled?', '["1/6","1/12","5/36","7/36"]', 0, 'medium', 'Problem Solving'),

-- Verbal & Communication
('aptitude', 'verbal', 'Choose the word most similar in meaning to GREGARIOUS.', '["Sociable","Solitary","Aggressive","Melancholy"]', 0, 'medium', 'Communication'),
('aptitude', 'verbal', 'Identify the grammatically correct sentence.', '["He does not know the answer.","He do not know the answer.","He did not knew the answer.","He did not knowed the answer."]', 0, 'easy', 'Communication'),
('aptitude', 'verbal', 'Choose the word opposite in meaning to METICULOUS.', '["Careless","Precise","Thorough","Diligent"]', 0, 'easy', 'Communication'),
('aptitude', 'verbal', 'Select the correct synonym for CANDID.', '["Frank and honest","Secretive","Shy","Deceitful"]', 0, 'easy', 'Communication'),
('aptitude', 'verbal', 'Complete the sentence: Despite the heavy rain, the event proceeded _______ scheduled.', '["as","like","so","with"]', 0, 'easy', 'Communication'),

-- Technical – Python Programming
('technical', 'python', 'What is the output of: print(type([]) is list)?', '["True","False","None","Error"]', 0, 'easy', 'Python'),
('technical', 'python', 'Which of the following is a mutable data type in Python?', '["list","tuple","string","int"]', 0, 'easy', 'Python'),
('technical', 'python', 'What does the "yield" keyword do in Python?', '["Creates a generator iterator","Terminates the program","Raises an exception","Imports a module"]', 0, 'medium', 'Python'),
('technical', 'python', 'What is the time complexity of Python list append()?', '["O(1) amortized","O(n)","O(log n)","O(n log n)"]', 0, 'medium', 'Python'),
('technical', 'python', 'Which decorator is used to define a class method in Python?', '["@classmethod","@staticmethod","@property","@abstractmethod"]', 0, 'medium', 'Python'),
('technical', 'python', 'How are dictionaries implemented in CPython for fast lookups?', '["Hash Table","Binary Search Tree","Linked List","Array of Tuples"]', 0, 'hard', 'Python'),

-- Technical – JavaScript & Web Development
('technical', 'web', 'What is the output of: console.log(typeof null) in JavaScript?', '["object","null","undefined","boolean"]', 0, 'medium', 'JavaScript'),
('technical', 'web', 'Which HTTP method is considered strictly idempotent?', '["PUT","POST","CONNECT","PATCH (partial)"]', 0, 'medium', 'REST API'),
('technical', 'web', 'What does the CSS "box-model" consist of in order?', '["Content, Padding, Border, Margin","Margin, Header, Body, Footer","Width, Height, Color, Font","Display, Position, Top, Left"]', 0, 'easy', 'HTML/CSS'),
('technical', 'web', 'In React, what hook is primarily used for managing side-effects like data fetching?', '["useEffect","useState","useMemo","useCallback"]', 0, 'easy', 'React'),
('technical', 'web', 'What is the difference between "==" and "===" in JavaScript?', '["=== checks both value and type without coercion","== is faster than ===","=== only checks memory addresses","There is no difference"]', 0, 'easy', 'JavaScript'),
('technical', 'web', 'Which status code indicates a successful resource creation in REST API?', '["201 Created","200 OK","204 No Content","202 Accepted"]', 0, 'easy', 'REST API'),

-- Technical – Java & OOP
('technical', 'java', 'Which concept in OOP allows a class to have multiple methods with the same name but different parameters?', '["Method Overloading","Method Overriding","Abstraction","Encapsulation"]', 0, 'easy', 'Java'),
('technical', 'java', 'What is the default value of a boolean variable in Java when declared as an instance variable?', '["false","true","null","0"]', 0, 'easy', 'Java'),
('technical', 'java', 'Which Java interface does NOT allow duplicate elements?', '["Set","List","Queue","ArrayList"]', 0, 'easy', 'Java'),
('technical', 'java', 'What is the purpose of the "final" keyword when applied to a variable in Java?', '["The value cannot be modified once assigned","The variable cannot be read","It automatically garbage collects the variable","It makes it global"]', 0, 'easy', 'Java'),

-- Technical – SQL & Databases
('technical', 'sql', 'Which SQL clause is used to filter aggregated groups?', '["HAVING","WHERE","GROUP BY","ORDER BY"]', 0, 'easy', 'SQL'),
('technical', 'sql', 'What does an INNER JOIN return?', '["Rows where there is a match in both tables","All rows from left table","All rows from right table","Cartesian product of both tables"]', 0, 'easy', 'SQL'),
('technical', 'sql', 'Which of the following is NOT a valid SQL aggregate function?', '["CONCAT","SUM","COUNT","AVG"]', 0, 'easy', 'SQL'),
('technical', 'sql', 'What type of database index organizes the physical storage order of the table data?', '["Clustered Index","Non-clustered Index","Bitmap Index","Unique Index"]', 0, 'medium', 'SQL'),
('technical', 'sql', 'Which property of ACID guarantees that database transactions are fully committed or fully rolled back?', '["Atomicity","Consistency","Isolation","Durability"]', 0, 'medium', 'SQL'),

-- Technical – Machine Learning & AI
('technical', 'ml', 'Which machine learning algorithm is most prone to high variance (overfitting) if unconstrained?', '["Unpruned Decision Tree","Naive Bayes","Linear Regression","Logistic Regression"]', 0, 'medium', 'Machine Learning'),
('technical', 'ml', 'What does an ROC curve plot?', '["True Positive Rate vs False Positive Rate","Precision vs Recall","Loss vs Epochs","Accuracy vs Validation Loss"]', 0, 'medium', 'Machine Learning'),
('technical', 'ml', 'Which ensemble technique builds multiple independent decision trees in parallel using bootstrapped data?', '["Random Forest (Bagging)","Gradient Boosting (GBDT)","AdaBoost","XGBoost"]', 0, 'medium', 'Machine Learning'),
('technical', 'ml', 'What is the primary purpose of L1 Regularization (Lasso) in ML models?', '["Promotes sparsity by driving irrelevant weights to zero","Squares the weight penalties","Prevents learning completely","Increases variance"]', 0, 'medium', 'Machine Learning'),
('technical', 'ml', 'In Deep Learning, which activation function solves the vanishing gradient problem for positive inputs?', '["ReLU","Sigmoid","Tanh","Softmax"]', 0, 'medium', 'Deep Learning'),

-- Technical – Cloud & AWS
('technical', 'cloud', 'Which AWS service is specifically designed for serverless distributed object storage?', '["Amazon S3","Amazon EC2","Amazon RDS","AWS Lambda"]', 0, 'easy', 'AWS'),
('technical', 'cloud', 'What is an AWS Lambda function?', '["A serverless event-driven compute service","A virtual machine instance","A relational database engine","A DNS routing service"]', 0, 'easy', 'AWS'),
('technical', 'cloud', 'In cloud computing, what does IaaS stand for?', '["Infrastructure as a Service","Integration as a Service","Internet as a Service","Interface as a Service"]', 0, 'easy', 'Cloud'),
('technical', 'cloud', 'Which AWS service provides managed Kubernetes cluster orchestration?', '["Amazon EKS","Amazon ECS","AWS Fargate","AWS CloudFormation"]', 0, 'medium', 'AWS'),

-- Technical – DevOps & Infrastructure
('technical', 'devops', 'What is the primary difference between a Docker container and a Virtual Machine?', '["Containers share the host OS kernel and are lightweight","VMs do not have an operating system","Containers run on bare hardware directly","VMs cannot run Linux"]', 0, 'medium', 'DevOps'),
('technical', 'devops', 'What is a Kubernetes Pod?', '["The smallest deployable computing unit containing one or more containers","A physical server blade","A cloud load balancer","A Git repository"]', 0, 'medium', 'Kubernetes'),
('technical', 'devops', 'What is the primary purpose of CI/CD in modern software development?', '["Automate building, testing, and continuous deployment of code","Store database backups manually","Track employee working hours","Manage server hardware cooling"]', 0, 'easy', 'DevOps'),

-- Technical – Cybersecurity
('technical', 'security', 'What type of cyber attack involves injecting malicious SQL queries into user input fields?', '["SQL Injection (SQLi)","Cross-Site Scripting (XSS)","Distributed Denial of Service (DDoS)","Man-in-the-Middle (MITM)"]', 0, 'easy', 'Cybersecurity'),
('technical', 'security', 'Which encryption scheme uses a Public Key for encryption and a Private Key for decryption?', '["Asymmetric Encryption (RSA/ECC)","Symmetric Encryption (AES)","Hashing (SHA-256)","Caesar Cipher"]', 0, 'medium', 'Cybersecurity'),
('technical', 'security', 'What is the primary role of a SOC (Security Operations Center) Analyst?', '["Monitor telemetry logs, triage threat alerts, and respond to security incidents","Write front-end CSS code","Design database schemas","Optimize cloud server costs"]', 0, 'easy', 'Cybersecurity'),
('technical', 'security', 'What does the security concept of "Zero Trust" mean?', '["Never trust, always verify every user and device access request","Trust all devices inside the internal corporate network","Disable all passwords and firewall rules","Only trust admin accounts"]', 0, 'medium', 'Cybersecurity'),

-- Technical – Data Structures & Algorithms
('technical', 'ds_algo', 'What is the average time complexity of searching in a balanced Hash Table?', '["O(1)","O(n)","O(log n)","O(n log n)"]', 0, 'easy', 'Problem Solving'),
('technical', 'ds_algo', 'Which data structure follows the LIFO (Last In First Out) principle?', '["Stack","Queue","Linked List","Binary Tree"]', 0, 'easy', 'Problem Solving'),
('technical', 'ds_algo', 'What is the worst-case time complexity of QuickSort when a bad pivot is chosen?', '["O(n²)","O(n log n)","O(n)","O(log n)"]', 0, 'medium', 'Problem Solving');
