DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'assignments'
      AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE assignments DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE assignments
  ADD CONSTRAINT assignments_target_scope_check
  CHECK (
    (target_type = 'class' AND class_id IS NOT NULL AND student_id IS NULL)
    OR
    (target_type = 'student' AND student_id IS NOT NULL)
  );
