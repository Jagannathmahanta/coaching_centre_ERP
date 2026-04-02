CREATE INDEX IF NOT EXISTS idx_students_center_join_date
  ON students(center_id, join_date DESC);

CREATE INDEX IF NOT EXISTS idx_fees_center_due_date
  ON fees(center_id, due_date DESC);

CREATE INDEX IF NOT EXISTS idx_fee_payments_center_date
  ON fee_payments(center_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_student_fee_profiles_center_structure_active
  ON student_fee_profiles(center_id, fee_structure_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_fee_structures_center_program_course
  ON fee_structures(center_id, program_type, course_name);
