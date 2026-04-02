CREATE TABLE IF NOT EXISTS class_definitions (
  id SERIAL PRIMARY KEY,
  center_id INT NOT NULL REFERENCES coaching_centers(id) ON DELETE CASCADE,
  class_name VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(center_id, class_name)
);

CREATE TABLE IF NOT EXISTS course_definitions (
  id SERIAL PRIMARY KEY,
  center_id INT NOT NULL REFERENCES coaching_centers(id) ON DELETE CASCADE,
  course_name VARCHAR(120) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(center_id, course_name)
);

CREATE TABLE IF NOT EXISTS batch_definitions (
  id SERIAL PRIMARY KEY,
  center_id INT NOT NULL REFERENCES coaching_centers(id) ON DELETE CASCADE,
  program_type VARCHAR(20) NOT NULL CHECK (program_type IN ('academic', 'non_academic')),
  board VARCHAR(50),
  class_id INT REFERENCES class_definitions(id) ON DELETE CASCADE,
  course_id INT REFERENCES course_definitions(id) ON DELETE CASCADE,
  shift VARCHAR(20) NOT NULL CHECK (shift IN ('morning', 'afternoon', 'evening')),
  batch_name VARCHAR(120) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (program_type = 'academic' AND class_id IS NOT NULL AND course_id IS NULL)
    OR
    (program_type = 'non_academic' AND course_id IS NOT NULL AND class_id IS NULL)
  ),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_class_definitions_center_status
  ON class_definitions(center_id, status);

CREATE INDEX IF NOT EXISTS idx_course_definitions_center_status
  ON course_definitions(center_id, status);

CREATE INDEX IF NOT EXISTS idx_batch_definitions_center_program_status
  ON batch_definitions(center_id, program_type, status);
