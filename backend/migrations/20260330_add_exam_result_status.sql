ALTER TABLE exam_results
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'present';

UPDATE exam_results
SET status = 'present'
WHERE status IS NULL OR TRIM(status) = '';

ALTER TABLE exam_results
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'present';
