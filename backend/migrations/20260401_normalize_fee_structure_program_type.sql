UPDATE fee_structures
SET program_type = 'non_academic'
WHERE program_type = 'course';

ALTER TABLE fee_structures
  DROP CONSTRAINT IF EXISTS fee_structures_program_type_check;

ALTER TABLE fee_structures
  ADD CONSTRAINT fee_structures_program_type_check
  CHECK (program_type IN ('academic', 'non_academic'));

ALTER TABLE fee_structures
  DROP CONSTRAINT IF EXISTS fee_structures_check;

ALTER TABLE fee_structures
  ADD CONSTRAINT fee_structures_check
  CHECK (
    (program_type = 'academic' AND class_name IS NOT NULL AND academic_year IS NOT NULL AND session_start_month IS NOT NULL AND session_end_month IS NOT NULL)
    OR
    (program_type = 'non_academic' AND course_name IS NOT NULL)
  );
