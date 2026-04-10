ALTER TABLE online_exams
  ADD COLUMN IF NOT EXISTS title_translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS instructions_translations JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE online_exams
SET
  title_translations = CASE
    WHEN COALESCE(title_translations, '{}'::jsonb) = '{}'::jsonb
      THEN jsonb_build_object('en', title)
    ELSE title_translations
  END,
  instructions_translations = CASE
    WHEN instructions IS NULL OR trim(instructions) = '' THEN COALESCE(instructions_translations, '{}'::jsonb)
    WHEN COALESCE(instructions_translations, '{}'::jsonb) = '{}'::jsonb
      THEN jsonb_build_object('en', instructions)
    ELSE instructions_translations
  END;

ALTER TABLE exam_questions
  ADD COLUMN IF NOT EXISTS question_text_translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS option_translations JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS explanation_translations JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE exam_questions
SET
  question_text_translations = CASE
    WHEN COALESCE(question_text_translations, '{}'::jsonb) = '{}'::jsonb
      THEN jsonb_build_object('en', question_text)
    ELSE question_text_translations
  END,
  option_translations = CASE
    WHEN jsonb_typeof(options) = 'array'
      AND COALESCE(option_translations, '[]'::jsonb) = '[]'::jsonb
      THEN COALESCE(
        (
          SELECT jsonb_agg(jsonb_build_object('en', value))
          FROM jsonb_array_elements_text(options) AS value
        ),
        '[]'::jsonb
      )
    ELSE COALESCE(option_translations, '[]'::jsonb)
  END,
  explanation_translations = CASE
    WHEN explanation IS NULL OR trim(explanation) = '' THEN COALESCE(explanation_translations, '{}'::jsonb)
    WHEN COALESCE(explanation_translations, '{}'::jsonb) = '{}'::jsonb
      THEN jsonb_build_object('en', explanation)
    ELSE explanation_translations
  END;
