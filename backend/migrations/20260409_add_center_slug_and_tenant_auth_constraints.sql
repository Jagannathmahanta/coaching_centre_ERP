ALTER TABLE coaching_centers
  ADD COLUMN IF NOT EXISTS slug VARCHAR(80);

WITH prepared AS (
  SELECT
    id,
    COALESCE(NULLIF(slug, ''), NULLIF(REGEXP_REPLACE(LOWER(name), '[^a-z0-9]+', '-', 'g'), ''), CONCAT('center-', id::text)) AS base_slug
  FROM coaching_centers
),
ranked AS (
  SELECT
    id,
    base_slug,
    ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS seq
  FROM prepared
)
UPDATE coaching_centers centers
SET slug = CASE
  WHEN ranked.seq = 1 THEN ranked.base_slug
  ELSE CONCAT(ranked.base_slug, '-', ranked.seq)
END
FROM ranked
WHERE centers.id = ranked.id
  AND (centers.slug IS NULL OR centers.slug = '');

ALTER TABLE coaching_centers
  ALTER COLUMN slug SET NOT NULL;

DROP INDEX IF EXISTS idx_coaching_centers_slug_unique;
CREATE UNIQUE INDEX idx_coaching_centers_slug_unique
  ON coaching_centers(slug);

UPDATE users
SET email = LOWER(email)
WHERE email IS NOT NULL;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_email_key;

DROP INDEX IF EXISTS idx_users_phone_unique;
DROP INDEX IF EXISTS idx_users_center_email_unique;
DROP INDEX IF EXISTS idx_users_center_phone_unique;
DROP INDEX IF EXISTS idx_users_platform_email_unique;
DROP INDEX IF EXISTS idx_users_platform_phone_unique;

CREATE UNIQUE INDEX idx_users_center_email_unique
  ON users(center_id, LOWER(email))
  WHERE email IS NOT NULL AND center_id IS NOT NULL;

CREATE UNIQUE INDEX idx_users_center_phone_unique
  ON users(center_id, phone)
  WHERE phone IS NOT NULL AND center_id IS NOT NULL;

CREATE UNIQUE INDEX idx_users_platform_email_unique
  ON users(LOWER(email))
  WHERE email IS NOT NULL AND center_id IS NULL;

CREATE UNIQUE INDEX idx_users_platform_phone_unique
  ON users(phone)
  WHERE phone IS NOT NULL AND center_id IS NULL;
