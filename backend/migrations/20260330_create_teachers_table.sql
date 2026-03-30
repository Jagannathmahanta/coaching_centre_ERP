CREATE TABLE IF NOT EXISTS teachers (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  phone             VARCHAR(20),
  email             VARCHAR(150),
  gender            VARCHAR(20),
  qualification     VARCHAR(150),
  assigned_subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
  assigned_classes  TEXT[] DEFAULT ARRAY[]::TEXT[],
  join_date         DATE DEFAULT CURRENT_DATE,
  status            VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes             TEXT,
  center_id         INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teachers_center_status ON teachers(center_id, status);
