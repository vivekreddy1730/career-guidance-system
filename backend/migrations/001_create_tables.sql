-- ============================================================
-- 001_create_tables.sql
-- Full DDL for AI Career Guidance System
-- Run once to bootstrap schema on a fresh MySQL/PlanetScale DB
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    phone         VARCHAR(20)  NOT NULL UNIQUE,
    email         VARCHAR(120) UNIQUE,
    name          VARCHAR(100),
    college       VARCHAR(200),
    branch        VARCHAR(100),
    year          INT,
    cgpa          FLOAT,
    interests     TEXT,          -- JSON array
    resume_url    VARCHAR(500),
    resume_parsed TINYINT(1)   DEFAULT 0,
    firebase_uid  VARCHAR(128) UNIQUE,
    created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    category    VARCHAR(50),
    description TEXT
);

CREATE TABLE IF NOT EXISTS student_skills (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    student_id  INT NOT NULL,
    skill_id    INT NOT NULL,
    proficiency INT DEFAULT 50,
    source      VARCHAR(20) DEFAULT 'declared',
    UNIQUE KEY uq_student_skill_source (student_id, skill_id, source),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id)   REFERENCES skills(id)   ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assessment_questions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    section       VARCHAR(50) NOT NULL,
    sub_section   VARCHAR(50),
    question_text TEXT        NOT NULL,
    options       TEXT        NOT NULL,  -- JSON array of 4 strings
    correct_index INT         NOT NULL,
    difficulty    VARCHAR(10) DEFAULT 'medium',
    skill_tag     VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS assessments (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    student_id   INT NOT NULL,
    started_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    score_report TEXT,   -- JSON
    total_score  FLOAT,
    status       VARCHAR(20) DEFAULT 'in_progress',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assessment_responses (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    assessment_id  INT NOT NULL,
    question_id    INT NOT NULL,
    selected_index INT,
    is_correct     TINYINT(1),
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id)   REFERENCES assessment_questions(id)
);

CREATE TABLE IF NOT EXISTS careers (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(100) NOT NULL UNIQUE,
    description      TEXT,
    avg_salary_inr   INT,
    demand_level     VARCHAR(20) DEFAULT 'high',
    industry         VARCHAR(100),
    search_keywords  TEXT  -- JSON
);

CREATE TABLE IF NOT EXISTS career_required_skills (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    career_id  INT NOT NULL,
    skill_id   INT NOT NULL,
    importance INT DEFAULT 75,
    FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id)  REFERENCES skills(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    title          VARCHAR(200) NOT NULL,
    provider       VARCHAR(50)  NOT NULL,
    url            VARCHAR(500),
    skill_tag      VARCHAR(100),
    career_id      INT,
    level          VARCHAR(20) DEFAULT 'beginner',
    duration_weeks INT,
    is_free        TINYINT(1) DEFAULT 0,
    FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS certifications (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    provider   VARCHAR(100) NOT NULL,
    url        VARCHAR(500),
    career_id  INT,
    skill_tag  VARCHAR(100),
    level      VARCHAR(20) DEFAULT 'associate',
    cost_usd   INT,
    FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS roadmaps (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    student_id   INT NOT NULL,
    career_title VARCHAR(100) NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_months INT DEFAULT 6,
    summary      TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS roadmap_milestones (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    roadmap_id     INT NOT NULL,
    month          INT NOT NULL,
    title          VARCHAR(200) NOT NULL,
    description    TEXT,
    tasks          TEXT,           -- JSON
    courses        TEXT,           -- JSON
    certifications TEXT,           -- JSON
    is_completed   TINYINT(1) DEFAULT 0,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);
