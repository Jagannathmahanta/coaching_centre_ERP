CREATE TABLE IF NOT EXISTS assignments (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('class', 'student')),
  class_id    INT REFERENCES class_definitions(id) ON DELETE SET NULL,
  student_id  INT REFERENCES students(id) ON DELETE CASCADE,
  due_date    DATE,
  status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  center_id   INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_by  INT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (target_type = 'class' AND class_id IS NOT NULL AND student_id IS NULL)
    OR
    (target_type = 'student' AND student_id IS NOT NULL AND class_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_assignments_center_created ON assignments(center_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON assignments(center_id, student_id, status);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(center_id, class_id, status);
