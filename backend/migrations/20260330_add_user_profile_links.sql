ALTER TABLE users
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS student_id INT REFERENCES students(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS teacher_id INT REFERENCES teachers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES parents(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_student_id_unique
  ON users(student_id)
  WHERE student_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_teacher_id_unique
  ON users(teacher_id)
  WHERE teacher_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_parent_id_unique
  ON users(parent_id)
  WHERE parent_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique
  ON users(phone)
  WHERE phone IS NOT NULL;
