ALTER TABLE students
  ADD COLUMN IF NOT EXISTS program_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS board VARCHAR(50),
  ADD COLUMN IF NOT EXISTS class_id INT REFERENCES class_definitions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS course_id INT REFERENCES course_definitions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS batch_id INT REFERENCES batch_definitions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admission_year INT;

ALTER TABLE fee_structures
  ADD COLUMN IF NOT EXISTS class_id INT REFERENCES class_definitions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS course_id INT REFERENCES course_definitions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS batch_id INT REFERENCES batch_definitions(id) ON DELETE SET NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO class_definitions (center_id, class_name)
SELECT DISTINCT center_id, TRIM(class_name)
FROM fee_structures
WHERE class_name IS NOT NULL
  AND TRIM(class_name) <> ''
ON CONFLICT (center_id, class_name) DO NOTHING;

INSERT INTO class_definitions (center_id, class_name)
SELECT DISTINCT center_id, TRIM(class)
FROM students
WHERE class IS NOT NULL
  AND TRIM(class) <> ''
ON CONFLICT (center_id, class_name) DO NOTHING;

INSERT INTO course_definitions (center_id, course_name)
SELECT DISTINCT center_id, TRIM(course_name)
FROM fee_structures
WHERE course_name IS NOT NULL
  AND TRIM(course_name) <> ''
ON CONFLICT (center_id, course_name) DO NOTHING;

UPDATE fee_structures fs
SET class_id = cd.id
FROM class_definitions cd
WHERE cd.center_id = fs.center_id
  AND cd.class_name = fs.class_name
  AND fs.class_id IS NULL;

UPDATE fee_structures fs
SET course_id = cr.id
FROM course_definitions cr
WHERE cr.center_id = fs.center_id
  AND cr.course_name = fs.course_name
  AND fs.course_id IS NULL;

UPDATE students s
SET
  class_id = cd.id,
  admission_year = COALESCE(s.admission_year, EXTRACT(YEAR FROM COALESCE(s.join_date, CURRENT_DATE))::INT)
FROM class_definitions cd
WHERE cd.center_id = s.center_id
  AND cd.class_name = s.class
  AND s.class_id IS NULL;

UPDATE students s
SET
  program_type = COALESCE(s.program_type, COALESCE(fs.program_type, 'academic')),
  board = COALESCE(s.board, fs.board),
  course_id = COALESCE(s.course_id, fs.course_id)
FROM student_fee_profiles fp
JOIN fee_structures fs ON fs.id = fp.fee_structure_id
WHERE fp.student_id = s.id
  AND fp.center_id = s.center_id
  AND fp.status = 'active';

UPDATE students
SET
  program_type = COALESCE(program_type, 'academic'),
  admission_year = COALESCE(admission_year, EXTRACT(YEAR FROM COALESCE(join_date, CURRENT_DATE))::INT);

CREATE INDEX IF NOT EXISTS idx_students_center_program_type
  ON students(center_id, program_type);

CREATE INDEX IF NOT EXISTS idx_students_center_class_id
  ON students(center_id, class_id);

CREATE INDEX IF NOT EXISTS idx_students_center_course_id
  ON students(center_id, course_id);

CREATE INDEX IF NOT EXISTS idx_students_center_batch_id
  ON students(center_id, batch_id);

CREATE INDEX IF NOT EXISTS idx_fee_structures_center_class_id
  ON fee_structures(center_id, class_id);

CREATE INDEX IF NOT EXISTS idx_fee_structures_center_course_id
  ON fee_structures(center_id, course_id);

CREATE INDEX IF NOT EXISTS idx_fee_structures_center_batch_id
  ON fee_structures(center_id, batch_id);
