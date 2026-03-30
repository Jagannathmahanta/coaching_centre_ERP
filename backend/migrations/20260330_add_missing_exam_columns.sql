ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS exam_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS exam_type VARCHAR(50) DEFAULT 'monthly_test',
  ADD COLUMN IF NOT EXISTS board VARCHAR(50),
  ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20);

UPDATE exams
SET
  exam_name = COALESCE(NULLIF(TRIM(exam_name), ''), CONCAT(subject, ' Exam')),
  exam_type = COALESCE(NULLIF(TRIM(exam_type), ''), 'monthly_test')
WHERE exam_name IS NULL
   OR TRIM(exam_name) = ''
   OR exam_type IS NULL
   OR TRIM(exam_type) = '';

ALTER TABLE exams
  ALTER COLUMN exam_name SET NOT NULL,
  ALTER COLUMN exam_type SET NOT NULL,
  ALTER COLUMN exam_type SET DEFAULT 'monthly_test';
