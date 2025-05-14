-- Create tables for the Competency Based Assessment application

-- Students table
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    class TEXT NOT NULL
);

-- Subjects table
CREATE TABLE subjects (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- Competencies table
CREATE TABLE competencies (
    id SERIAL PRIMARY KEY,
    subject_code TEXT REFERENCES subjects(code),
    description TEXT NOT NULL
);

-- Assessments table
CREATE TABLE assessments (
    student_id TEXT REFERENCES students(id),
    subject_code TEXT REFERENCES subjects(code),
    competency_id INTEGER REFERENCES competencies(id),
    level INTEGER CHECK (level >= 1 AND level <= 5),
    score_subject INTEGER CHECK (score_subject >= 0 AND score_subject <= 100),
    score_generic INTEGER CHECK (score_generic >= 0 AND score_generic <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    PRIMARY KEY (student_id, subject_code, competency_id, level)
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update the updated_at column
CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_students_class ON students(class);
CREATE INDEX idx_competencies_subject_code ON competencies(subject_code);
CREATE INDEX idx_assessments_student_subject ON assessments(student_id, subject_code);