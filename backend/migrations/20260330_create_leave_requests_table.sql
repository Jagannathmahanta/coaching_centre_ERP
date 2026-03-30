CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  center_id INT NOT NULL REFERENCES coaching_centers(id) ON DELETE CASCADE,
  applicant_type VARCHAR(20) NOT NULL CHECK (applicant_type IN ('student', 'teacher')),
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  teacher_id INT REFERENCES teachers(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  total_days INT NOT NULL CHECK (total_days >= 1),
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note TEXT,
  reviewed_by INT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (applicant_type = 'student' AND student_id IS NOT NULL AND teacher_id IS NULL)
    OR
    (applicant_type = 'teacher' AND teacher_id IS NOT NULL AND student_id IS NULL)
  ),
  CHECK (to_date >= from_date)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_center_status
  ON leave_requests(center_id, status, applicant_type);

CREATE INDEX IF NOT EXISTS idx_leave_requests_dates
  ON leave_requests(center_id, from_date, to_date);
