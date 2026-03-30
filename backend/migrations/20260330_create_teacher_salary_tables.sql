CREATE TABLE IF NOT EXISTS teacher_salary_structures (
  id                 SERIAL PRIMARY KEY,
  teacher_id         INT REFERENCES teachers(id) ON DELETE CASCADE,
  pay_type           VARCHAR(20) NOT NULL CHECK (pay_type IN ('monthly', 'per_day', 'per_period')),
  basic_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  ta_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  da_amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  hra_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  other_allowance    NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_day_rate       NUMERIC(10,2) NOT NULL DEFAULT 0,
  per_period_rate    NUMERIC(10,2) NOT NULL DEFAULT 0,
  allowed_paid_leaves INT NOT NULL DEFAULT 1,
  status             VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  center_id          INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id)
);

CREATE TABLE IF NOT EXISTS teacher_salary_slips (
  id                SERIAL PRIMARY KEY,
  teacher_id        INT REFERENCES teachers(id) ON DELETE CASCADE,
  structure_id      INT REFERENCES teacher_salary_structures(id) ON DELETE CASCADE,
  salary_month      DATE NOT NULL,
  pay_type          VARCHAR(20) NOT NULL CHECK (pay_type IN ('monthly', 'per_day', 'per_period')),
  working_days      INT NOT NULL DEFAULT 30,
  attended_days     INT NOT NULL DEFAULT 30,
  periods_taken     INT NOT NULL DEFAULT 0,
  paid_leaves_taken INT NOT NULL DEFAULT 0,
  gross_salary      NUMERIC(10,2) NOT NULL DEFAULT 0,
  leave_deduction   NUMERIC(10,2) NOT NULL DEFAULT 0,
  other_deduction   NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_salary        NUMERIC(10,2) NOT NULL DEFAULT 0,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_date         DATE,
  payment_mode      VARCHAR(30),
  remarks           TEXT,
  center_id         INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, salary_month)
);

CREATE INDEX IF NOT EXISTS idx_teacher_salary_structures_center ON teacher_salary_structures(center_id, status);
CREATE INDEX IF NOT EXISTS idx_teacher_salary_slips_center_month ON teacher_salary_slips(center_id, salary_month, status);
