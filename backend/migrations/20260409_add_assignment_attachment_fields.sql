ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS attachment_mime_type VARCHAR(120),
  ADD COLUMN IF NOT EXISTS attachment_path TEXT,
  ADD COLUMN IF NOT EXISTS attachment_size INT;
