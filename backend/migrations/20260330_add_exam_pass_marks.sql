ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS pass_marks INT DEFAULT 35;

UPDATE exams
SET pass_marks = CASE
  WHEN max_marks IS NOT NULL AND max_marks > 0 THEN CEIL(max_marks * 0.35)
  ELSE 35
END
WHERE pass_marks IS NULL OR pass_marks <= 0;

ALTER TABLE exams
  ALTER COLUMN pass_marks SET DEFAULT 35;
