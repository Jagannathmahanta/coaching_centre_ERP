ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS target_scope VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (target_scope IN ('all', 'filtered')),
  ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) CHECK (program_type IN ('academic', 'non_academic')),
  ADD COLUMN IF NOT EXISTS class_id INT REFERENCES class_definitions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS course_id INT REFERENCES course_definitions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS batch_id INT REFERENCES batch_definitions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notices_center_scope
  ON notices(center_id, target_scope, target_audience, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notices_center_class_id
  ON notices(center_id, class_id)
  WHERE class_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notices_center_course_id
  ON notices(center_id, course_id)
  WHERE course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notices_center_batch_id
  ON notices(center_id, batch_id)
  WHERE batch_id IS NOT NULL;
