CREATE TABLE IF NOT EXISTS teacher_daily_attendance (
  id SERIAL PRIMARY KEY,
  center_id INT NOT NULL REFERENCES coaching_centers(id) ON DELETE CASCADE,
  teacher_id INT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  check_in_latitude NUMERIC(10, 7),
  check_in_longitude NUMERIC(10, 7),
  check_out_latitude NUMERIC(10, 7),
  check_out_longitude NUMERIC(10, 7),
  total_minutes INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(center_id, teacher_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_teacher_daily_attendance_center_date
  ON teacher_daily_attendance(center_id, attendance_date DESC);

CREATE INDEX IF NOT EXISTS idx_teacher_daily_attendance_teacher_date
  ON teacher_daily_attendance(teacher_id, attendance_date DESC);
