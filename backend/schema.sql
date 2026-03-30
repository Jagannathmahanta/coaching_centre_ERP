-- ═══════════════════════════════════════════════════════════════════
-- BrightCoach Management System - PostgreSQL Schema
-- Run: psql -U postgres -d coaching_db -f schema.sql
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Coaching Centers (multi-tenant) ─────────────────────────────
CREATE TABLE coaching_centers (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  city        VARCHAR(100),
  address     TEXT,
  phone       VARCHAR(15),
  email       VARCHAR(100),
  status      VARCHAR(20) DEFAULT 'active',
  plan        VARCHAR(20) DEFAULT 'basic',  -- basic | standard | premium
  plan_expiry DATE,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Users ────────────────────────────────────────────────────────
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(150) UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(30) DEFAULT 'admin',  -- admin | staff | parent
  center_id     INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  phone         VARCHAR(15),
  student_id    INT,
  teacher_id    INT,
  parent_id     INT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_users_student_id_unique ON users(student_id) WHERE student_id IS NOT NULL;
CREATE UNIQUE INDEX idx_users_teacher_id_unique ON users(teacher_id) WHERE teacher_id IS NOT NULL;
CREATE UNIQUE INDEX idx_users_parent_id_unique ON users(parent_id) WHERE parent_id IS NOT NULL;
CREATE UNIQUE INDEX idx_users_phone_unique ON users(phone) WHERE phone IS NOT NULL;

-- ─── Parents ──────────────────────────────────────────────────────
CREATE TABLE parents (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  phone      VARCHAR(15) NOT NULL,
  email      VARCHAR(100),
  address    TEXT,
  city       VARCHAR(100),
  center_id  INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone, center_id)
);

-- ─── Students ─────────────────────────────────────────────────────
CREATE TABLE students (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  roll_number  VARCHAR(30),
  class        VARCHAR(30) NOT NULL,  -- 'Class X', 'Class XII', etc.
  phone        VARCHAR(15),
  address      TEXT,
  city         VARCHAR(100),
  dob          DATE,
  gender       VARCHAR(10),
  parent_id    INT REFERENCES parents(id) ON DELETE SET NULL,
  center_id    INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  status       VARCHAR(20) DEFAULT 'active',  -- active | inactive | left
  photo_url    TEXT,
  join_date    DATE DEFAULT CURRENT_DATE,
  advance_fee_balance NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (advance_fee_balance >= 0),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(roll_number, center_id)
);
CREATE INDEX idx_students_center ON students(center_id);
CREATE INDEX idx_students_class  ON students(class);

ALTER TABLE users
  ADD CONSTRAINT users_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;

ALTER TABLE users
  ADD CONSTRAINT users_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL;

-- ─── Fee Definitions (academic + course) ───────────────────────────
CREATE TABLE fee_structures (
  id                     SERIAL PRIMARY KEY,
  center_id              INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  name                   VARCHAR(150) NOT NULL,
  program_type           VARCHAR(20) NOT NULL CHECK (program_type IN ('academic', 'course')),
  board                  VARCHAR(50),
  class_name             VARCHAR(30),
  course_name            VARCHAR(100),
  academic_year          VARCHAR(20),
  duration_months        INT NOT NULL CHECK (duration_months BETWEEN 1 AND 24),
  session_start_month    INT CHECK (session_start_month BETWEEN 1 AND 12),
  session_end_month      INT CHECK (session_end_month BETWEEN 1 AND 12),
  tuition_total          NUMERIC(10,2) NOT NULL CHECK (tuition_total >= 0),
  hostel_total           NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (hostel_total >= 0),
  transport_total        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (transport_total >= 0),
  description            TEXT,
  monthly_tuition_fee    NUMERIC(10,2) GENERATED ALWAYS AS (ROUND((tuition_total / duration_months::numeric), 2)) STORED,
  monthly_hostel_fee     NUMERIC(10,2) GENERATED ALWAYS AS (ROUND((hostel_total / duration_months::numeric), 2)) STORED,
  monthly_transport_fee  NUMERIC(10,2) GENERATED ALWAYS AS (ROUND((transport_total / duration_months::numeric), 2)) STORED,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (program_type = 'academic' AND class_name IS NOT NULL AND academic_year IS NOT NULL AND session_start_month IS NOT NULL AND session_end_month IS NOT NULL)
    OR
    (program_type = 'course' AND course_name IS NOT NULL)
  )
);
CREATE INDEX idx_fee_structures_center_program ON fee_structures(center_id, program_type, academic_year);

-- ─── Student Fee Plans ─────────────────────────────────────────────
CREATE TABLE student_fee_profiles (
  id                     SERIAL PRIMARY KEY,
  student_id             INT REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id       INT REFERENCES fee_structures(id) ON DELETE RESTRICT,
  billing_cycle          VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'half_yearly', 'yearly', 'full_package')),
  plan_start_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  due_day                INT DEFAULT 5 CHECK (due_day BETWEEN 1 AND 28),
  include_transport      BOOLEAN DEFAULT FALSE,
  include_hostel         BOOLEAN DEFAULT FALSE,
  transport_fee_total    NUMERIC(10,2) DEFAULT 0 CHECK (transport_fee_total >= 0),
  hostel_fee_total       NUMERIC(10,2) DEFAULT 0 CHECK (hostel_fee_total >= 0),
  tuition_fee_total      NUMERIC(10,2) DEFAULT 0 CHECK (tuition_fee_total >= 0),
  applicable_months      INT NOT NULL CHECK (applicable_months BETWEEN 1 AND 24),
  notes                  TEXT,
  status                 VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  center_id              INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_student_fee_profiles_active
ON student_fee_profiles(student_id)
WHERE status = 'active';

-- ─── Fees / Installments ──────────────────────────────────────────
CREATE TABLE fees (
  id               SERIAL PRIMARY KEY,
  fee_profile_id   INT REFERENCES student_fee_profiles(id) ON DELETE CASCADE,
  student_id       INT REFERENCES students(id) ON DELETE CASCADE,
  installment_no   INT NOT NULL,
  installment_label VARCHAR(120) NOT NULL,
  billing_cycle    VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'half_yearly', 'yearly', 'full_package')),
  period_start     DATE NOT NULL,
  period_end       DATE NOT NULL,
  due_date         DATE NOT NULL,
  months_covered   INT NOT NULL CHECK (months_covered BETWEEN 1 AND 24),
  tuition_amount   NUMERIC(10,2) NOT NULL CHECK (tuition_amount >= 0),
  transport_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (transport_amount >= 0),
  hostel_amount    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (hostel_amount >= 0),
  total_amount     NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  late_fee_amount  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (late_fee_amount >= 0),
  discount_amount  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  waived_amount    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (waived_amount >= 0),
  paid_amount      NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  paid_tuition_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_tuition_amount >= 0),
  paid_hostel_amount  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_hostel_amount >= 0),
  paid_transport_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_transport_amount >= 0),
  paid_adjustment_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (paid_adjustment_amount >= 0),
  balance          NUMERIC(10,2) NOT NULL CHECK (balance >= 0),
  status           VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'waived')),
  last_payment_date DATE,
  notes            TEXT,
  reminder_sent_at TIMESTAMPTZ,
  center_id        INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fee_profile_id, installment_no)
);
CREATE INDEX idx_fees_center_status ON fees(center_id, status);
CREATE INDEX idx_fees_student_due ON fees(student_id, due_date);
CREATE INDEX idx_fees_profile ON fees(fee_profile_id);

-- ─── Transport Routes ─────────────────────────────────────────────
CREATE TABLE transport_routes (
  id             SERIAL PRIMARY KEY,
  route_name     VARCHAR(200) NOT NULL,
  vehicle_number VARCHAR(30),
  vehicle_type   VARCHAR(30),  -- bus | minibus | van | auto
  driver_name    VARCHAR(100),
  driver_phone   VARCHAR(15),
  capacity       INT DEFAULT 20,
  monthly_fee    NUMERIC(10,2),
  status         VARCHAR(20) DEFAULT 'active',
  center_id      INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Hostels ───────────────────────────────────────────────────────
CREATE TABLE hostels (
  id            SERIAL PRIMARY KEY,
  hostel_name   VARCHAR(150) NOT NULL,
  gender_type   VARCHAR(20) NOT NULL CHECK (gender_type IN ('boys', 'girls')),
  address       TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  center_id     INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hostel_name, center_id)
);

-- ─── Hostel Rooms ─────────────────────────────────────────────────
CREATE TABLE hostel_rooms (
  id           SERIAL PRIMARY KEY,
  hostel_id    INT REFERENCES hostels(id) ON DELETE CASCADE,
  room_number  VARCHAR(20) NOT NULL,
  floor        VARCHAR(20),
  type         VARCHAR(20),  -- single | double | triple | dormitory
  capacity     INT NOT NULL,
  occupied     INT DEFAULT 0,
  monthly_fee  NUMERIC(10,2),
  amenities    TEXT[],  -- {'AC', 'WiFi', 'Attached Bathroom'}
  status       VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  center_id    INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hostel_id, room_number)
);

-- ─── Student Allocations (Transport + Hostel) ─────────────────────
CREATE TABLE student_allocations (
  id         SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  hostel_id  INT REFERENCES hostels(id) ON DELETE SET NULL,
  route_id   INT REFERENCES transport_routes(id) ON DELETE SET NULL,
  room_id    INT REFERENCES hostel_rooms(id) ON DELETE SET NULL,
  type       VARCHAR(20) NOT NULL,  -- transport | hostel
  center_id  INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date   DATE,
  status     VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Exams ────────────────────────────────────────────────────────
CREATE TABLE exams (
  id         SERIAL PRIMARY KEY,
  exam_name  VARCHAR(150) NOT NULL,
  exam_type  VARCHAR(50) NOT NULL DEFAULT 'monthly_test',
  subject    VARCHAR(100) NOT NULL,
  class      VARCHAR(30) NOT NULL,
  board      VARCHAR(50),
  academic_year VARCHAR(20),
  exam_date  DATE NOT NULL,
  time       TIME,
  duration   VARCHAR(20),  -- '3 hrs'
  max_marks  INT DEFAULT 100,
  pass_marks INT DEFAULT 35,
  examiner   VARCHAR(100),
  hall       VARCHAR(50),
  notes      TEXT,
  center_id  INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Exam Results ─────────────────────────────────────────────────
CREATE TABLE exam_results (
  id             SERIAL PRIMARY KEY,
  exam_id        INT REFERENCES exams(id) ON DELETE CASCADE,
  student_id     INT REFERENCES students(id) ON DELETE CASCADE,
  status         VARCHAR(20) NOT NULL DEFAULT 'present',
  marks_obtained NUMERIC(6,2),
  grade          VARCHAR(5),  -- A+, A, B+, B, C, F
  rank           INT,
  remarks        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- ─── Leave Requests ───────────────────────────────────────────────
CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  center_id INT NOT NULL REFERENCES coaching_centers(id) ON DELETE CASCADE,
  applicant_type VARCHAR(20) NOT NULL CHECK (applicant_type IN ('student', 'teacher')),
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  teacher_id INT REFERENCES teachers(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  total_days INT NOT NULL CHECK (total_days >= 1),
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note TEXT,
  reviewed_by INT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (applicant_type = 'student' AND student_id IS NOT NULL AND teacher_id IS NULL)
    OR
    (applicant_type = 'teacher' AND teacher_id IS NOT NULL AND student_id IS NULL)
  ),
  CHECK (to_date >= from_date)
);
CREATE INDEX idx_leave_requests_center_status ON leave_requests(center_id, status, applicant_type);
CREATE INDEX idx_leave_requests_dates ON leave_requests(center_id, from_date, to_date);

-- ─── Student Attendance ───────────────────────────────────────────
CREATE TABLE student_attendance (
  id SERIAL PRIMARY KEY,
  center_id INT NOT NULL REFERENCES coaching_centers(id) ON DELETE CASCADE,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  academic_session VARCHAR(20) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'leave')),
  remarks TEXT,
  marked_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, attendance_date, academic_session)
);
CREATE INDEX idx_student_attendance_center_date ON student_attendance(center_id, attendance_date, academic_session);
CREATE INDEX idx_student_attendance_student_date ON student_attendance(student_id, attendance_date DESC);

-- ─── Notices ──────────────────────────────────────────────────────
CREATE TABLE notices (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(200) NOT NULL,
  content         TEXT NOT NULL,
  target_audience VARCHAR(50) DEFAULT 'all',  -- all | students | parents | class-x | class-xii
  priority        VARCHAR(20) DEFAULT 'medium',  -- high | medium | low
  expires_at      DATE,
  center_id       INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_by      INT REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notices_center ON notices(center_id);

CREATE TABLE holidays (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  center_id   INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_by  INT REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date)
);
CREATE INDEX idx_holidays_center_dates ON holidays(center_id, start_date, end_date);

CREATE TABLE teachers (
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
CREATE INDEX idx_teachers_center_status ON teachers(center_id, status);

ALTER TABLE users
  ADD CONSTRAINT users_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

CREATE TABLE teacher_salary_structures (
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

CREATE TABLE teacher_salary_slips (
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
  paid_amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_date         DATE,
  payment_mode      VARCHAR(30),
  remarks           TEXT,
  center_id         INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, salary_month)
);
CREATE INDEX idx_teacher_salary_structures_center ON teacher_salary_structures(center_id, status);
CREATE INDEX idx_teacher_salary_slips_center_month ON teacher_salary_slips(center_id, salary_month, status);

CREATE TABLE fee_payments (
  id             SERIAL PRIMARY KEY,
  fee_id         INT REFERENCES fees(id) ON DELETE CASCADE,
  student_id     INT REFERENCES students(id) ON DELETE CASCADE,
  center_id      INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  advance_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (advance_amount >= 0),
  tuition_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (tuition_amount >= 0),
  hostel_amount  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (hostel_amount >= 0),
  transport_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (transport_amount >= 0),
  adjustment_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (adjustment_amount >= 0),
  payment_date   DATE NOT NULL,
  payment_mode   VARCHAR(30),
  transaction_id TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fee_payments_fee ON fee_payments(fee_id);
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id, payment_date DESC);

-- ─── Attendance ───────────────────────────────────────────────────
CREATE TABLE attendance (
  id         SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  status     VARCHAR(20) DEFAULT 'present',  -- present | absent | late
  remarks    TEXT,
  center_id  INT REFERENCES coaching_centers(id) ON DELETE CASCADE,
  UNIQUE(student_id, date)
);

-- ─── Seed Data ────────────────────────────────────────────────────
-- Insert a demo coaching center and admin
INSERT INTO coaching_centers (name, city, phone, email, plan) 
VALUES ('Bright Academy', 'Bhubaneswar', '9876543200', 'admin@brightacademy.in', 'premium');

-- Password: Admin@123 (bcrypt hash)
INSERT INTO users (name, email, password_hash, role, center_id)
VALUES ('Admin User', 'admin@brightacademy.in', '$2a$10$Y1QvpH2KVvNq4ZFJbwRtMuJ8hQfGnALVzPq7MfVJwXS7vQN3.xeyu', 'admin', 1);

-- Insert fee definitions
INSERT INTO fee_structures (
  center_id, name, program_type, board, class_name, academic_year, duration_months,
  session_start_month, session_end_month, tuition_total, hostel_total, transport_total, description
) VALUES
  (1, 'Class IX CBSE', 'academic', 'CBSE', 'Class IX', '2026-2027', 12, 3, 2, 22000, 15000, 12000, 'CBSE academic session'),
  (1, 'Class X CBSE', 'academic', 'CBSE', 'Class X', '2026-2027', 12, 3, 2, 24000, 18000, 18000, 'CBSE board batch'),
  (1, 'Class XII State Board', 'academic', 'State Board', 'Class XII', '2026-2027', 12, 3, 2, 26000, 18000, 15000, 'State board senior secondary'),
  (1, 'PGDCA', 'course', NULL, NULL, NULL, 6, NULL, NULL, 18000, 9000, 0, 'Six month computer course');

-- ─── Useful Views ─────────────────────────────────────────────────
DROP VIEW IF EXISTS fee_summary;

CREATE VIEW fee_summary AS
SELECT 
  c.name as center_name,
  TO_CHAR(f.due_date, 'Mon YYYY') as due_month,
  COUNT(*) as total_records,
  SUM(f.total_amount) as total_billed,
  SUM(f.paid_amount) as total_collected,
  SUM(f.balance) as total_pending,
  COUNT(*) FILTER (WHERE f.status='paid') as paid_count,
  COUNT(*) FILTER (WHERE f.status='pending') as pending_count,
  COUNT(*) FILTER (WHERE f.status='partial') as partial_count
FROM fees f
JOIN coaching_centers c ON f.center_id = c.id
GROUP BY c.name, TO_CHAR(f.due_date, 'Mon YYYY');

CREATE VIEW student_full_profile AS
SELECT 
  s.*,
  p.name as parent_name, p.phone as parent_phone, p.email as parent_email,
  sa_t.route_id,
  tr.route_name, tr.vehicle_number,
  sa_h.room_id,
  hr.room_number, hr.floor
FROM students s
LEFT JOIN parents p ON s.parent_id = p.id
LEFT JOIN student_allocations sa_t ON sa_t.student_id = s.id AND sa_t.type='transport'
LEFT JOIN transport_routes tr ON sa_t.route_id = tr.id
LEFT JOIN student_allocations sa_h ON sa_h.student_id = s.id AND sa_h.type='hostel'
LEFT JOIN hostel_rooms hr ON sa_h.room_id = hr.id;
