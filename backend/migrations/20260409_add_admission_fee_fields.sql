ALTER TABLE fee_structures
  ADD COLUMN IF NOT EXISTS admission_total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (admission_total >= 0);

ALTER TABLE student_fee_profiles
  ADD COLUMN IF NOT EXISTS admission_fee_total NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (admission_fee_total >= 0);

ALTER TABLE fees
  ADD COLUMN IF NOT EXISTS admission_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (admission_amount >= 0),
  ADD COLUMN IF NOT EXISTS paid_admission_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_admission_amount >= 0);

ALTER TABLE fee_payments
  ADD COLUMN IF NOT EXISTS admission_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (admission_amount >= 0);
