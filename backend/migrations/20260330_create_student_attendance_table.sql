CREATE TABLE IF NOT EXISTS student_attendance (
  id SERIAL PRIMARY KEY,
  center_id INT NOT NULL REFERENCES coaching_centers(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  academic_session VARCHAR(20) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'leave')),
  remarks TEXT,
  marked_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, attendance_date, academic_session)
);

CREATE INDEX IF NOT EXISTS idx_student_attendance_center_date
  ON student_attendance(center_id, attendance_date, academic_session);

CREATE INDEX IF NOT EXISTS idx_student_attendance_student_date
  ON student_attendance(student_id, attendance_date DESC);
