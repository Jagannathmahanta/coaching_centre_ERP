const pool = require("../../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const toNumber = (value) => Number(value || 0);

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || null;
};

const normalizePhone = (value) => {
  const normalized = String(value || "").trim();
  return normalized || null;
};

const slugifyCenterName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const buildAttendancePeriod = (row) => {
  const data = row || {};
  const totalMarked = toNumber(data.total_marked);
  const presentCount = toNumber(data.present_count);
  const absentCount = toNumber(data.absent_count);
  const leaveCount = toNumber(data.leave_count);

  return {
    present_count: presentCount,
    absent_count: absentCount,
    leave_count: leaveCount,
    total_marked: totalMarked,
    present_percentage: totalMarked > 0 ? Number(((presentCount / totalMarked) * 100).toFixed(1)) : 0,
  };
};

const ensureTeacherUser = (req) => {
  const teacherId = Number(req.user && req.user.teacher_id);
  if (!teacherId) {
    throw createError("Teacher profile not linked to this account.", 403);
  }
  return teacherId;
};

const ensureStudentUser = (req) => {
  const studentId = Number(req.user && req.user.student_id);
  if (!studentId) {
    throw createError("Student profile not linked to this account.", 403);
  }
  return studentId;
};

const ensureParentUser = (req) => {
  const parentId = Number(req.user && req.user.parent_id);
  if (!parentId) {
    throw createError("Parent profile not linked to this account.", 403);
  }
  return parentId;
};

const ensureSuperAdmin = (req) => {
  if ((req.user && req.user.role) !== "super_admin") {
    throw createError("Only super admin can access this resource.", 403);
  }
};

const getTenantSummary = async (centerId) => {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      name,
      slug,
      city,
      status,
      plan,
      created_at
    FROM coaching_centers
    WHERE id = $1
    LIMIT 1
    `,
    [centerId]
  );

  if (!rows[0]) {
    throw createError("Institute not found.", 404);
  }

  return rows[0];
};

const resolveUniqueCenterSlug = async (client, requestedSlug, centerName, excludeCenterId = null) => {
  const baseSlug = slugifyCenterName(requestedSlug || centerName);
  if (!baseSlug) {
    throw createError("Center slug could not be generated. Add a valid center name.", 400);
  }

  const params = [baseSlug, `${baseSlug}-%`];
  let query = `
    SELECT slug
    FROM coaching_centers
    WHERE (slug = $1 OR slug LIKE $2)
  `;

  if (excludeCenterId) {
    params.push(excludeCenterId);
    query += ` AND id <> $3`;
  }

  const { rows } = await client.query(query, params);
  const usedSlugs = new Set(rows.map((row) => row.slug));
  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (usedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
};

const getTeacherProfile = async (centerId, teacherId) => {
  const { rows } = await pool.query(
    `
    SELECT id, name, qualification, assigned_classes, assigned_subjects, join_date, status
    FROM teachers
    WHERE id = $1 AND center_id = $2
    `,
    [teacherId, centerId]
  );

  if (!rows[0]) {
    throw createError("Teacher not found.", 404);
  }

  return rows[0];
};

const getStudentProfile = async (centerId, studentId) => {
  const { rows } = await pool.query(
    `
    SELECT id, name, class, board, roll_number, join_date, status
    FROM students
    WHERE id = $1 AND center_id = $2
    `,
    [studentId, centerId]
  );

  if (!rows[0]) {
    throw createError("Student not found.", 404);
  }

  return rows[0];
};

const getParentProfile = async (centerId, parentId) => {
  const { rows } = await pool.query(
    `
    SELECT id, name, phone, email
    FROM parents
    WHERE id = $1 AND center_id = $2
    `,
    [parentId, centerId]
  );

  if (!rows[0]) {
    throw createError("Parent not found.", 404);
  }

  return rows[0];
};

exports.getDashboard = async (req) => {
  const cid = req.user.center_id;
  if (!cid) {
    throw createError("Center context is required for this dashboard.", 403);
  }

  const [
    tenantRes,
    studentStatsRes,
    teacherStatsRes,
    teacherAttendanceSummaryRes,
    teacherAttendanceListRes,
    feeStatsRes,
    upcomingExamsRes,
    recentResultsRes,
    recentNoticesRes,
    upcomingHolidaysRes,
    pendingFeesRes,
    monthlyOverviewRes,
    admissionsComparisonRes,
    attendanceComparisonRes,
    todayAttendanceRes,
    classWiseStudentsRes,
    courseWiseStudentsRes,
  ] = await Promise.all([
    pool.query(
      `
      SELECT
        id,
        name,
        slug,
        city,
        status,
        plan,
        created_at
      FROM coaching_centers
      WHERE id = $1
      LIMIT 1
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT 
        COUNT(*) as total_students,
        COUNT(*) FILTER (WHERE status='active') as active_students
      FROM students 
      WHERE center_id=$1
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT
        COUNT(*) AS total_teachers,
        COUNT(*) FILTER (WHERE status = 'active') AS active_teachers
      FROM teachers
      WHERE center_id = $1
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT
        COUNT(*)::int AS checked_in_today,
        COUNT(*) FILTER (WHERE status = 'checked_out')::int AS checked_out_today,
        COUNT(*) FILTER (WHERE status = 'checked_in')::int AS on_duty_now
      FROM teacher_daily_attendance
      WHERE center_id = $1
        AND attendance_date = CURRENT_DATE
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT
        tda.id,
        tda.teacher_id,
        t.name AS teacher_name,
        tda.attendance_date,
        tda.check_in_at,
        tda.check_out_at,
        tda.total_minutes,
        tda.status
      FROM teacher_daily_attendance tda
      JOIN teachers t
        ON t.id = tda.teacher_id
       AND t.center_id = tda.center_id
      WHERE tda.center_id = $1
        AND tda.attendance_date = CURRENT_DATE
      ORDER BY tda.check_in_at ASC NULLS LAST, t.name ASC
      LIMIT 8
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT 
        COALESCE(SUM(paid_amount) FILTER (
          WHERE date_trunc('month', due_date) = date_trunc('month', CURRENT_DATE)
        ),0) as collected_this_month,
        COALESCE(SUM(balance) FILTER (
          WHERE status IN ('pending', 'partial')
            AND balance > 0
            AND due_date <= CURRENT_DATE
        ), 0) as pending_this_month,
        COUNT(*) FILTER (
          WHERE status IN ('pending', 'partial')
            AND balance > 0
            AND due_date <= CURRENT_DATE
        ) as pending_fee_count
      FROM fees 
      WHERE center_id=$1
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT
        id,
        exam_name,
        subject,
        class,
        board,
        academic_year,
        exam_date,
        time,
        0 AS results_count
      FROM exams
      WHERE center_id = $1
        AND exam_date >= CURRENT_DATE
        AND exam_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY exam_date ASC, time NULLS LAST
      LIMIT 6
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT
        e.id AS exam_id,
        e.exam_name,
        e.subject,
        e.class,
        e.exam_date,
        COUNT(er.id) AS result_count,
        MAX(er.created_at) AS last_result_at
      FROM exam_results er
      JOIN exams e ON e.id = er.exam_id
      WHERE e.center_id = $1
      GROUP BY e.id
      ORDER BY MAX(er.created_at) DESC
      LIMIT 8
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT
        id,
        title,
        content,
        priority,
        target_audience,
        expires_at,
        created_at
      FROM notices 
      WHERE center_id=$1 
        AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT
        id,
        title,
        description AS content,
        start_date,
        end_date,
        status,
        created_at
      FROM holidays
      WHERE center_id = $1
        AND status = 'active'
        AND end_date >= CURRENT_DATE
      ORDER BY start_date ASC, end_date ASC
      LIMIT 5
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT
        f.id AS fee_id,
        s.name AS student_name,
        s.class,
        s.roll_number,
        f.installment_label,
        f.due_date,
        f.balance,
        f.total_amount,
        f.status
      FROM fees f
      JOIN students s ON s.id = f.student_id
      WHERE f.center_id = $1
        AND f.status IN ('pending', 'partial')
        AND f.balance > 0
        AND f.due_date <= CURRENT_DATE
      ORDER BY f.due_date ASC, f.balance DESC
      LIMIT 8
      `,
      [cid]
    ),

    pool.query(
      `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
          date_trunc('month', CURRENT_DATE),
          INTERVAL '1 month'
        )::date AS month_start
      ),
      collections AS (
        SELECT
          date_trunc('month', payment_date)::date AS month_start,
          COALESCE(SUM(amount), 0) AS collected_amount
        FROM fee_payments
        WHERE center_id = $1
        GROUP BY 1
      ),
      pending AS (
        SELECT
          date_trunc('month', due_date)::date AS month_start,
          COALESCE(SUM(balance), 0) AS pending_amount
        FROM fees
        WHERE center_id = $1
        GROUP BY 1
      ),
      enrollments AS (
        SELECT
          date_trunc('month', join_date)::date AS month_start,
          COUNT(*) AS new_enrollments
        FROM students
        WHERE center_id = $1
        GROUP BY 1
      )
      SELECT
        m.month_start,
        TO_CHAR(m.month_start, 'Mon') AS month_label,
        COALESCE(c.collected_amount, 0) AS collected_amount,
        COALESCE(p.pending_amount, 0) AS pending_amount,
        COALESCE(e.new_enrollments, 0) AS new_enrollments
      FROM months m
      LEFT JOIN collections c ON c.month_start = m.month_start
      LEFT JOIN pending p ON p.month_start = m.month_start
      LEFT JOIN enrollments e ON e.month_start = m.month_start
      ORDER BY m.month_start ASC
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE join_date >= date_trunc('month', CURRENT_DATE)
            AND join_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
        ) AS this_month,
        COUNT(*) FILTER (
          WHERE join_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
            AND join_date < date_trunc('month', CURRENT_DATE)
        ) AS last_month
      FROM students
      WHERE center_id = $1
      `,
      [cid]
    ),

    pool.query(
      `
      WITH periods AS (
        SELECT
          'this_month'::text AS period,
          date_trunc('month', CURRENT_DATE)::date AS start_date,
          CURRENT_DATE::date AS end_date
        UNION ALL
        SELECT
          'last_month'::text AS period,
          (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date AS start_date,
          (date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::date AS end_date
      )
      SELECT
        p.period,
        COUNT(sa.id) AS total_marked,
        COUNT(*) FILTER (WHERE sa.status = 'present') AS present_count,
        COUNT(*) FILTER (WHERE sa.status = 'absent') AS absent_count,
        COUNT(*) FILTER (WHERE sa.status = 'leave') AS leave_count
      FROM periods p
      LEFT JOIN student_attendance sa
        ON sa.center_id = $1
       AND sa.attendance_date BETWEEN p.start_date AND p.end_date
      GROUP BY p.period
      ORDER BY p.period DESC
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT
        COUNT(id) AS total_marked,
        COUNT(*) FILTER (WHERE status = 'present') AS present_count,
        COUNT(*) FILTER (WHERE status = 'absent') AS absent_count,
        COUNT(*) FILTER (WHERE status = 'leave') AS leave_count
      FROM student_attendance
      WHERE center_id = $1
        AND attendance_date = CURRENT_DATE
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT
        s.class AS label,
        COUNT(*)::int AS value
      FROM students s
      WHERE s.center_id = $1
        AND s.status = 'active'
      GROUP BY s.class
      ORDER BY value DESC, label ASC
      `,
      [cid]
    ),

    pool.query(
      `
      SELECT
        fs.course_name AS label,
        COUNT(DISTINCT s.id)::int AS value
      FROM students s
      JOIN student_fee_profiles fp
        ON fp.student_id = s.id
       AND fp.center_id = s.center_id
       AND fp.status = 'active'
      JOIN fee_structures fs
        ON fs.id = fp.fee_structure_id
      WHERE s.center_id = $1
        AND s.status = 'active'
        AND fs.program_type = 'non_academic'
        AND fs.course_name IS NOT NULL
      GROUP BY fs.course_name
      ORDER BY value DESC, label ASC
      `,
      [cid]
    ),
  ]);

  const admissionCounts = admissionsComparisonRes.rows[0] || {};
  const thisMonthAdmissions = toNumber(admissionCounts.this_month);
  const lastMonthAdmissions = toNumber(admissionCounts.last_month);
  const admissionsChangePercent =
    lastMonthAdmissions > 0
      ? Number((((thisMonthAdmissions - lastMonthAdmissions) / lastMonthAdmissions) * 100).toFixed(1))
      : thisMonthAdmissions > 0
        ? 100
        : 0;

  const attendanceMap = attendanceComparisonRes.rows.reduce((acc, row) => {
    acc[row.period] = buildAttendancePeriod(row);
    return acc;
  }, {});

  return {
    tenant: tenantRes.rows[0] || null,
    stats: {
      total_students: toNumber(studentStatsRes.rows[0] && studentStatsRes.rows[0].total_students),
      active_students: toNumber(studentStatsRes.rows[0] && studentStatsRes.rows[0].active_students),
      total_teachers: toNumber(teacherStatsRes.rows[0] && teacherStatsRes.rows[0].total_teachers),
      active_teachers: toNumber(teacherStatsRes.rows[0] && teacherStatsRes.rows[0].active_teachers),
      checked_in_teachers_today: toNumber(teacherAttendanceSummaryRes.rows[0] && teacherAttendanceSummaryRes.rows[0].checked_in_today),
      checked_out_teachers_today: toNumber(teacherAttendanceSummaryRes.rows[0] && teacherAttendanceSummaryRes.rows[0].checked_out_today),
      teachers_on_duty_now: toNumber(teacherAttendanceSummaryRes.rows[0] && teacherAttendanceSummaryRes.rows[0].on_duty_now),
      collected_this_month: toNumber(feeStatsRes.rows[0] && feeStatsRes.rows[0].collected_this_month),
      pending_this_month: toNumber(feeStatsRes.rows[0] && feeStatsRes.rows[0].pending_this_month),
      pending_fee_count: toNumber(feeStatsRes.rows[0] && feeStatsRes.rows[0].pending_fee_count),
      upcoming_exam_count: upcomingExamsRes.rowCount,
      recent_result_count: recentResultsRes.rowCount,
      active_notice_count: recentNoticesRes.rowCount,
      holiday_notice_count: upcomingHolidaysRes.rowCount,
    },
    analytics: {
      monthly_overview: monthlyOverviewRes.rows.map((row) => ({
        month_start: row.month_start,
        month_label: String(row.month_label).trim(),
        collected_amount: toNumber(row.collected_amount),
        pending_amount: toNumber(row.pending_amount),
        new_enrollments: toNumber(row.new_enrollments),
      })),
      admissions_comparison: {
        this_month: thisMonthAdmissions,
        last_month: lastMonthAdmissions,
        change_percent: admissionsChangePercent,
      },
      today_attendance: buildAttendancePeriod(todayAttendanceRes.rows[0]),
      attendance_comparison: {
        this_month: attendanceMap.this_month || buildAttendancePeriod(),
        last_month: attendanceMap.last_month || buildAttendancePeriod(),
      },
      class_wise_students: classWiseStudentsRes.rows.map((row) => ({
        label: row.label,
        value: toNumber(row.value),
      })),
      course_wise_students: courseWiseStudentsRes.rows.map((row) => ({
        label: row.label,
        value: toNumber(row.value),
      })),
    },
    recent_notices: recentNoticesRes.rows,
    upcoming_exams: upcomingExamsRes.rows,
    recent_results: recentResultsRes.rows,
    upcoming_holidays: upcomingHolidaysRes.rows,
    teacher_attendance_today: teacherAttendanceListRes.rows.map((row) => ({
      ...row,
      total_minutes: toNumber(row.total_minutes),
    })),
    pending_fees: pendingFeesRes.rows.map((row) => ({
      ...row,
      balance: toNumber(row.balance),
      total_amount: toNumber(row.total_amount),
    })),
  };
};

exports.getPlatformCenters = async (req) => {
  ensureSuperAdmin(req);

  const { rows } = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.city,
      c.status,
      c.plan,
      c.created_at,
      COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'admin')::int AS admin_count,
      COUNT(DISTINCT s.id)::int AS student_count,
      COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'active')::int AS active_teacher_count
    FROM coaching_centers c
    LEFT JOIN users u
      ON u.center_id = c.id
    LEFT JOIN students s
      ON s.center_id = c.id
    LEFT JOIN teachers t
      ON t.center_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC, c.id DESC
    `
  );

  return {
    centers: rows,
  };
};

exports.impersonateCenter = async (req) => {
  ensureSuperAdmin(req);

  const centerId = Number(req.body && req.body.center_id);
  if (!centerId) {
    throw createError("center_id is required.", 400);
  }

  const tenant = await getTenantSummary(centerId);

  const token = jwt.sign(
    {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: "admin",
      platform_role: "super_admin",
      is_staff: false,
      center_id: tenant.id,
      center_slug: tenant.slug,
      center_name: tenant.name,
      student_id: null,
      teacher_id: null,
      parent_id: null,
      is_impersonated: true,
      impersonator_id: req.user.id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: "admin",
      platform_role: "super_admin",
      is_staff: false,
      center_id: tenant.id,
      center_slug: tenant.slug,
      center_name: tenant.name,
      student_id: null,
      teacher_id: null,
      parent_id: null,
      is_impersonated: true,
      impersonator_id: req.user.id,
    },
  };
};

exports.createPlatformCenter = async (req) => {
  ensureSuperAdmin(req);

  const centerName = String(req.body && req.body.name || "").trim();
  const city = String(req.body && req.body.city || "").trim() || null;
  const requestedSlug = String(req.body && req.body.slug || "").trim();
  const plan = String(req.body && req.body.plan || "basic").trim().toLowerCase();
  const adminName = String(req.body && req.body.admin_name || "").trim();
  const adminEmail = normalizeEmail(req.body && req.body.admin_email);
  const adminPhone = normalizePhone(req.body && req.body.admin_phone);
  const adminPassword = String(req.body && req.body.admin_password || "");

  if (!centerName) throw createError("Institute name is required.");
  if (!adminName) throw createError("Admin name is required.");
  if (!adminEmail) throw createError("Admin email is required.");
  if (adminPassword.length < 6) throw createError("Admin password must be at least 6 characters.");
  if (!["basic", "standard", "premium"].includes(plan)) {
    throw createError("Plan must be basic, standard, or premium.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const centerSlug = await resolveUniqueCenterSlug(client, requestedSlug, centerName);
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await client.query(
      `
      SELECT id
      FROM users
      WHERE center_id IS NOT NULL
        AND (($1::text IS NOT NULL AND LOWER(email) = $1) OR ($2::text IS NOT NULL AND phone = $2))
      LIMIT 1
      `,
      [adminEmail, adminPhone]
    );

    if (existingAdmin.rows[0]) {
      throw createError("Another institute user already exists with this admin email or phone.");
    }

    const centerInsert = await client.query(
      `
      INSERT INTO coaching_centers (name, slug, city, plan, status)
      VALUES ($1, $2, $3, $4, 'active')
      RETURNING id, name, slug, city, status, plan, created_at
      `,
      [centerName, centerSlug, city, plan]
    );

    const center = centerInsert.rows[0];

    const adminInsert = await client.query(
      `
      INSERT INTO users (name, email, phone, password_hash, role, center_id, is_staff)
      VALUES ($1, $2, $3, $4, 'admin', $5, FALSE)
      RETURNING id, name, email, phone, role, center_id, created_at
      `,
      [adminName, adminEmail, adminPhone, passwordHash, center.id]
    );

    await client.query("COMMIT");

    return {
      center,
      admin: adminInsert.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.updatePlatformCenter = async (req) => {
  ensureSuperAdmin(req);

  const centerId = Number(req.params.id);
  if (!centerId) {
    throw createError("Valid center id is required.");
  }

  const existing = await getTenantSummary(centerId);
  const centerName = String(req.body && req.body.name || existing.name || "").trim();
  const city = String(req.body && req.body.city !== undefined ? req.body.city : existing.city || "").trim() || null;
  const requestedSlug = String(req.body && req.body.slug || existing.slug || "").trim();
  const plan = String(req.body && req.body.plan || existing.plan || "basic").trim().toLowerCase();

  if (!centerName) throw createError("Institute name is required.");
  if (!["basic", "standard", "premium"].includes(plan)) {
    throw createError("Plan must be basic, standard, or premium.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const centerSlug = await resolveUniqueCenterSlug(client, requestedSlug, centerName, centerId);

    const { rows } = await client.query(
      `
      UPDATE coaching_centers
      SET name = $1,
          slug = $2,
          city = $3,
          plan = $4
      WHERE id = $5
      RETURNING id, name, slug, city, status, plan, created_at
      `,
      [centerName, centerSlug, city, plan, centerId]
    );

    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.updatePlatformCenterStatus = async (req) => {
  ensureSuperAdmin(req);

  const centerId = Number(req.params.id);
  const status = String(req.body && req.body.status || "").trim().toLowerCase();
  if (!centerId) throw createError("Valid center id is required.");
  if (!["active", "inactive"].includes(status)) {
    throw createError("Status must be active or inactive.");
  }

  const { rows } = await pool.query(
    `
    UPDATE coaching_centers
    SET status = $1
    WHERE id = $2
    RETURNING id, name, slug, city, status, plan, created_at
    `,
    [status, centerId]
  );

  if (!rows[0]) {
    throw createError("Institute not found.", 404);
  }

  return rows[0];
};

exports.getStudentDashboard = async (req) => {
  const centerId = req.user.center_id;
  const studentId = ensureStudentUser(req);

  const [studentRes, todayAttendanceRes, monthlyAttendanceRes, pendingFeesRes, feeSummaryRes, upcomingExamsRes, recentResultsRes, noticesRes, holidaysRes] = await Promise.all([
    getStudentProfile(centerId, studentId),

    pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status = 'present') AS present_count,
        COUNT(*) FILTER (WHERE status = 'absent') AS absent_count,
        COUNT(*) FILTER (WHERE status = 'leave') AS leave_count,
        COUNT(*) AS total_marked
      FROM student_attendance
      WHERE center_id = $1
        AND student_id = $2
        AND attendance_date = CURRENT_DATE
      `,
      [centerId, studentId]
    ),

    pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status = 'present') AS present_count,
        COUNT(*) FILTER (WHERE status = 'absent') AS absent_count,
        COUNT(*) FILTER (WHERE status = 'leave') AS leave_count,
        COUNT(*) AS total_marked
      FROM student_attendance
      WHERE center_id = $1
        AND student_id = $2
        AND attendance_date >= date_trunc('month', CURRENT_DATE)
        AND attendance_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
      `,
      [centerId, studentId]
    ),

    pool.query(
      `
      SELECT
        f.id AS fee_id,
        s.name AS student_name,
        s.class,
        s.roll_number,
        f.installment_label,
        f.due_date,
        f.balance,
        f.status
      FROM fees f
      JOIN students s ON s.id = f.student_id
      WHERE f.center_id = $1
        AND f.student_id = $2
        AND f.status IN ('pending', 'partial')
        AND f.balance > 0
        AND f.due_date <= CURRENT_DATE
      ORDER BY f.due_date ASC, f.balance DESC
      LIMIT 8
      `,
      [centerId, studentId]
    ),

    pool.query(
      `
      SELECT
        COALESCE(SUM(balance), 0) AS pending_amount,
        COUNT(*) FILTER (WHERE status IN ('pending', 'partial') AND balance > 0) AS pending_fee_count
      FROM fees
      WHERE center_id = $1
        AND student_id = $2
        AND status IN ('pending', 'partial')
        AND balance > 0
        AND due_date <= CURRENT_DATE
      `,
      [centerId, studentId]
    ),

    pool.query(
      `
      SELECT
        e.id,
        e.exam_name,
        e.subject,
        e.class,
        e.board,
        e.exam_date,
        e.time
      FROM exams e
      JOIN students s
        ON s.id = $2
       AND s.center_id = $1
      WHERE e.center_id = $1
        AND e.class = s.class
        AND e.exam_date >= CURRENT_DATE
      ORDER BY e.exam_date ASC, e.time NULLS LAST
      LIMIT 6
      `,
      [centerId, studentId]
    ),

    pool.query(
      `
      SELECT
        e.id AS exam_id,
        e.exam_name,
        e.subject,
        e.class,
        MAX(er.created_at) AS last_result_at
      FROM exam_results er
      JOIN exams e
        ON e.id = er.exam_id
      WHERE e.center_id = $1
        AND er.student_id = $2
      GROUP BY e.id
      ORDER BY MAX(er.created_at) DESC
      LIMIT 8
      `,
      [centerId, studentId]
    ),

    pool.query(
      `
      SELECT n.id, n.title, n.content, n.priority, n.created_at
      FROM notices n
      JOIN students s
        ON s.id = $2
       AND s.center_id = n.center_id
      WHERE n.center_id = $1
        AND (n.expires_at IS NULL OR n.expires_at >= CURRENT_DATE)
        AND lower(COALESCE(n.target_audience, 'all')) IN ('all', 'student', 'students')
        AND (
          COALESCE(n.target_scope, 'all') = 'all'
          OR (
            n.program_type = 'academic'
            AND s.class_id = n.class_id
            AND (n.batch_id IS NULL OR n.batch_id = s.batch_id)
          )
          OR (
            n.program_type = 'non_academic'
            AND s.course_id = n.course_id
            AND (n.batch_id IS NULL OR n.batch_id = s.batch_id)
          )
        )
      ORDER BY n.created_at DESC
      LIMIT 6
      `,
      [centerId, studentId]
    ),

    pool.query(
      `
      SELECT
        id,
        title,
        description AS content,
        start_date,
        end_date
      FROM holidays
      WHERE center_id = $1
        AND status = 'active'
        AND end_date >= CURRENT_DATE
      ORDER BY start_date ASC, end_date ASC
      LIMIT 5
      `,
      [centerId]
    ),
  ]);

  return {
    student: studentRes,
    stats: {
      pending_amount: toNumber(feeSummaryRes.rows[0] && feeSummaryRes.rows[0].pending_amount),
      pending_fee_count: toNumber(feeSummaryRes.rows[0] && feeSummaryRes.rows[0].pending_fee_count),
      upcoming_exam_count: upcomingExamsRes.rowCount,
      recent_result_count: recentResultsRes.rowCount,
    },
    analytics: {
      today_attendance: buildAttendancePeriod(todayAttendanceRes.rows[0]),
      month_attendance: buildAttendancePeriod(monthlyAttendanceRes.rows[0]),
    },
    recent_notices: noticesRes.rows,
    upcoming_exams: upcomingExamsRes.rows,
    recent_results: recentResultsRes.rows,
    upcoming_holidays: holidaysRes.rows,
    pending_fees: pendingFeesRes.rows.map((row) => ({
      ...row,
      balance: toNumber(row.balance),
    })),
  };
};

exports.getParentDashboard = async (req) => {
  const centerId = req.user.center_id;
  const parentId = ensureParentUser(req);

  const [parentRes, childrenRes, todayAttendanceRes, pendingFeesRes, feeSummaryRes, upcomingExamsRes, recentResultsRes, noticesRes, holidaysRes] = await Promise.all([
    getParentProfile(centerId, parentId),

    pool.query(
      `
      SELECT id, name, class, roll_number, status, join_date
      FROM students
      WHERE center_id = $1
        AND parent_id = $2
      ORDER BY created_at DESC
      `,
      [centerId, parentId]
    ),

    pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE sa.status = 'present') AS present_count,
        COUNT(*) FILTER (WHERE sa.status = 'absent') AS absent_count,
        COUNT(*) FILTER (WHERE sa.status = 'leave') AS leave_count,
        COUNT(sa.id) AS total_marked
      FROM students s
      LEFT JOIN student_attendance sa
        ON sa.student_id = s.id
       AND sa.center_id = s.center_id
       AND sa.attendance_date = CURRENT_DATE
      WHERE s.center_id = $1
        AND s.parent_id = $2
      `,
      [centerId, parentId]
    ),

    pool.query(
      `
      SELECT
        f.id AS fee_id,
        s.name AS student_name,
        s.class,
        s.roll_number,
        f.installment_label,
        f.due_date,
        f.balance,
        f.status
      FROM fees f
      JOIN students s ON s.id = f.student_id
      WHERE f.center_id = $1
        AND s.parent_id = $2
        AND f.status IN ('pending', 'partial')
        AND f.balance > 0
        AND f.due_date <= CURRENT_DATE
      ORDER BY f.due_date ASC, f.balance DESC
      LIMIT 10
      `,
      [centerId, parentId]
    ),

    pool.query(
      `
      SELECT
        COALESCE(SUM(f.balance), 0) AS pending_amount,
        COUNT(*) FILTER (WHERE f.status IN ('pending', 'partial') AND f.balance > 0) AS pending_fee_count
      FROM fees f
      JOIN students s ON s.id = f.student_id
      WHERE f.center_id = $1
        AND s.parent_id = $2
        AND f.status IN ('pending', 'partial')
        AND f.balance > 0
        AND f.due_date <= CURRENT_DATE
      `,
      [centerId, parentId]
    ),

    pool.query(
      `
      WITH child_classes AS (
        SELECT DISTINCT class
        FROM students
        WHERE center_id = $1
          AND parent_id = $2
          AND class IS NOT NULL
      )
      SELECT
        e.id,
        e.exam_name,
        e.subject,
        e.class,
        e.board,
        e.exam_date,
        e.time
      FROM exams e
      JOIN child_classes cc
        ON cc.class = e.class
      WHERE e.center_id = $1
        AND e.exam_date >= CURRENT_DATE
      ORDER BY e.exam_date ASC, e.time NULLS LAST
      LIMIT 8
      `,
      [centerId, parentId]
    ),

    pool.query(
      `
      SELECT
        e.id AS exam_id,
        e.exam_name,
        e.subject,
        e.class,
        MAX(er.created_at) AS last_result_at,
        MAX(s.name) AS child_name
      FROM exam_results er
      JOIN exams e
        ON e.id = er.exam_id
      JOIN students s
        ON s.id = er.student_id
      WHERE e.center_id = $1
        AND s.parent_id = $2
      GROUP BY e.id
      ORDER BY MAX(er.created_at) DESC
      LIMIT 8
      `,
      [centerId, parentId]
    ),

    pool.query(
      `
      SELECT n.id, n.title, n.content, n.priority, n.created_at
      FROM notices n
      WHERE n.center_id = $1
        AND (n.expires_at IS NULL OR n.expires_at >= CURRENT_DATE)
        AND lower(COALESCE(n.target_audience, 'all')) IN ('all', 'parent', 'parents')
        AND (
          COALESCE(n.target_scope, 'all') = 'all'
          OR EXISTS (
            SELECT 1
            FROM students s
            WHERE s.center_id = n.center_id
              AND s.parent_id = $2
              AND (
                (
                  n.program_type = 'academic'
                  AND s.class_id = n.class_id
                  AND (n.batch_id IS NULL OR n.batch_id = s.batch_id)
                )
                OR (
                  n.program_type = 'non_academic'
                  AND s.course_id = n.course_id
                  AND (n.batch_id IS NULL OR n.batch_id = s.batch_id)
                )
              )
          )
        )
      ORDER BY n.created_at DESC
      LIMIT 6
      `,
      [centerId, parentId]
    ),

    pool.query(
      `
      SELECT
        id,
        title,
        description AS content,
        start_date,
        end_date
      FROM holidays
      WHERE center_id = $1
        AND status = 'active'
        AND end_date >= CURRENT_DATE
      ORDER BY start_date ASC, end_date ASC
      LIMIT 5
      `,
      [centerId]
    ),
  ]);

  const children = childrenRes.rows || [];

  return {
    parent: parentRes,
    children,
    stats: {
      total_children: children.length,
      active_children: children.filter((item) => item.status === "active").length,
      pending_amount: toNumber(feeSummaryRes.rows[0] && feeSummaryRes.rows[0].pending_amount),
      pending_fee_count: toNumber(feeSummaryRes.rows[0] && feeSummaryRes.rows[0].pending_fee_count),
      upcoming_exam_count: upcomingExamsRes.rowCount,
    },
    analytics: {
      today_attendance: buildAttendancePeriod(todayAttendanceRes.rows[0]),
    },
    recent_notices: noticesRes.rows,
    upcoming_exams: upcomingExamsRes.rows,
    recent_results: recentResultsRes.rows,
    upcoming_holidays: holidaysRes.rows,
    pending_fees: pendingFeesRes.rows.map((row) => ({
      ...row,
      balance: toNumber(row.balance),
    })),
  };
};

exports.getTeacherDashboard = async (req) => {
  const centerId = req.user.center_id;
  const teacherId = ensureTeacherUser(req);

  const [teacherRes, todayAttendanceRes, assignedStatsRes, classAttendanceRes, noticesRes, holidaysRes, pendingRes, upcomingExamsRes, recentResultsRes] = await Promise.all([
    getTeacherProfile(centerId, teacherId),

    pool.query(
      `
      SELECT
        id,
        attendance_date,
        check_in_at,
        check_out_at,
        check_in_latitude,
        check_in_longitude,
        check_out_latitude,
        check_out_longitude,
        total_minutes,
        status,
        created_at,
        updated_at
      FROM teacher_daily_attendance
      WHERE center_id = $1
        AND teacher_id = $2
        AND attendance_date = CURRENT_DATE
      LIMIT 1
      `,
      [centerId, teacherId]
    ),

    pool.query(
      `
      WITH assigned_labels AS (
        SELECT DISTINCT label
        FROM unnest(COALESCE((SELECT assigned_classes FROM teachers WHERE id = $2 AND center_id = $1), ARRAY[]::text[])) AS label
        WHERE label IS NOT NULL AND btrim(label) <> ''
      )
      SELECT
        (SELECT COUNT(*)::int FROM assigned_labels) AS assigned_class_count,
        (
          SELECT COUNT(DISTINCT s.id)::int
          FROM assigned_labels a
          JOIN students s
            ON s.center_id = $1
           AND s.status = 'active'
          LEFT JOIN student_fee_profiles fp
            ON fp.student_id = s.id
           AND fp.center_id = s.center_id
           AND fp.status = 'active'
          LEFT JOIN fee_structures fs
            ON fs.id = fp.fee_structure_id
          WHERE a.label = COALESCE(NULLIF(btrim(s.class), ''), fs.class_name)
             OR a.label = fs.course_name
        ) AS total_student_count
      `,
      [centerId, teacherId]
    ),

    pool.query(
      `
      WITH assigned_labels AS (
        SELECT DISTINCT label
        FROM unnest(COALESCE((SELECT assigned_classes FROM teachers WHERE id = $2 AND center_id = $1), ARRAY[]::text[])) AS label
        WHERE label IS NOT NULL AND btrim(label) <> ''
      )
      SELECT
        a.label,
        COUNT(sa.id)::int AS total_marked,
        COUNT(*) FILTER (WHERE sa.status = 'present')::int AS present_count,
        COUNT(*) FILTER (WHERE sa.status = 'absent')::int AS absent_count,
        COUNT(*) FILTER (WHERE sa.status = 'leave')::int AS leave_count
      FROM assigned_labels a
      JOIN students s
        ON s.center_id = $1
       AND s.status = 'active'
      LEFT JOIN student_fee_profiles fp
        ON fp.student_id = s.id
       AND fp.center_id = s.center_id
       AND fp.status = 'active'
      LEFT JOIN fee_structures fs
        ON fs.id = fp.fee_structure_id
      LEFT JOIN student_attendance sa
        ON sa.student_id = s.id
       AND sa.center_id = s.center_id
       AND sa.attendance_date = CURRENT_DATE
      WHERE a.label = COALESCE(NULLIF(btrim(s.class), ''), fs.class_name)
         OR a.label = fs.course_name
      GROUP BY a.label
      ORDER BY a.label ASC
      `,
      [centerId, teacherId]
    ),

    pool.query(
      `
      SELECT
        id,
        title,
        content,
        priority,
        created_at
      FROM notices
      WHERE center_id = $1
        AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
        AND lower(COALESCE(target_audience, 'all')) IN ('all', 'teacher', 'teachers')
      ORDER BY created_at DESC
      LIMIT 6
      `,
      [centerId]
    ),

    pool.query(
      `
      SELECT
        id,
        title,
        description AS content,
        start_date,
        end_date
      FROM holidays
      WHERE center_id = $1
        AND status = 'active'
        AND end_date >= CURRENT_DATE
      ORDER BY start_date ASC, end_date ASC
      LIMIT 5
      `,
      [centerId]
    ),

    pool.query(
      `
      WITH assigned_labels AS (
        SELECT DISTINCT label
        FROM unnest(COALESCE((SELECT assigned_classes FROM teachers WHERE id = $2 AND center_id = $1), ARRAY[]::text[])) AS label
        WHERE label IS NOT NULL AND btrim(label) <> ''
      ),
      unmarked_classes AS (
        SELECT COUNT(*)::int AS count
        FROM assigned_labels a
        WHERE NOT EXISTS (
          SELECT 1
          FROM students s
          LEFT JOIN student_fee_profiles fp
            ON fp.student_id = s.id
           AND fp.center_id = s.center_id
           AND fp.status = 'active'
          LEFT JOIN fee_structures fs
            ON fs.id = fp.fee_structure_id
          JOIN student_attendance sa
            ON sa.student_id = s.id
           AND sa.center_id = s.center_id
           AND sa.attendance_date = CURRENT_DATE
          WHERE s.center_id = $1
            AND s.status = 'active'
            AND (
              a.label = COALESCE(NULLIF(btrim(s.class), ''), fs.class_name)
              OR a.label = fs.course_name
            )
        )
      )
      SELECT
        COALESCE((
          SELECT COUNT(*)::int
          FROM leave_requests
          WHERE center_id = $1
            AND applicant_type = 'teacher'
            AND teacher_id = $2
            AND status = 'pending'
        ), 0) AS pending_leave_count,
        COALESCE((SELECT count FROM unmarked_classes), 0) AS classes_pending_attendance
      `,
      [centerId, teacherId]
    ),

    pool.query(
      `
      WITH assigned_labels AS (
        SELECT DISTINCT label
        FROM unnest(COALESCE((SELECT assigned_classes FROM teachers WHERE id = $2 AND center_id = $1), ARRAY[]::text[])) AS label
        WHERE label IS NOT NULL AND btrim(label) <> ''
      )
      SELECT
        e.id,
        e.exam_name,
        e.subject,
        e.class,
        e.board,
        e.exam_date,
        e.time
      FROM exams e
      JOIN assigned_labels a
        ON a.label = e.class
      WHERE e.center_id = $1
        AND e.exam_date >= CURRENT_DATE
      ORDER BY e.exam_date ASC, e.time NULLS LAST
      LIMIT 6
      `,
      [centerId, teacherId]
    ),

    pool.query(
      `
      WITH assigned_labels AS (
        SELECT DISTINCT label
        FROM unnest(COALESCE((SELECT assigned_classes FROM teachers WHERE id = $2 AND center_id = $1), ARRAY[]::text[])) AS label
        WHERE label IS NOT NULL AND btrim(label) <> ''
      )
      SELECT
        e.id AS exam_id,
        e.exam_name,
        e.subject,
        e.class,
        MAX(er.created_at) AS last_result_at
      FROM exam_results er
      JOIN exams e
        ON e.id = er.exam_id
      JOIN assigned_labels a
        ON a.label = e.class
      WHERE e.center_id = $1
      GROUP BY e.id
      ORDER BY MAX(er.created_at) DESC
      LIMIT 6
      `,
      [centerId, teacherId]
    ),
  ]);

  const attendanceRows = classAttendanceRes.rows || [];
  const todayAttendanceSummary = attendanceRows.reduce((acc, row) => {
    acc.present_count += toNumber(row.present_count);
    acc.absent_count += toNumber(row.absent_count);
    acc.leave_count += toNumber(row.leave_count);
    acc.total_marked += toNumber(row.total_marked);
    return acc;
  }, { present_count: 0, absent_count: 0, leave_count: 0, total_marked: 0 });

  return {
    teacher: teacherRes,
    today_attendance: todayAttendanceRes.rows[0]
      ? {
          ...todayAttendanceRes.rows[0],
          total_minutes: toNumber(todayAttendanceRes.rows[0].total_minutes),
        }
      : null,
    stats: {
      assigned_class_count: toNumber(assignedStatsRes.rows[0] && assignedStatsRes.rows[0].assigned_class_count),
      total_student_count: toNumber(assignedStatsRes.rows[0] && assignedStatsRes.rows[0].total_student_count),
      pending_leave_count: toNumber(pendingRes.rows[0] && pendingRes.rows[0].pending_leave_count),
      classes_pending_attendance: toNumber(pendingRes.rows[0] && pendingRes.rows[0].classes_pending_attendance),
    },
    analytics: {
      today_attendance: buildAttendancePeriod(todayAttendanceSummary),
      class_attendance: attendanceRows.map((row) => ({
        label: row.label,
        present_count: toNumber(row.present_count),
        absent_count: toNumber(row.absent_count),
        leave_count: toNumber(row.leave_count),
        total_marked: toNumber(row.total_marked),
      })),
    },
    recent_notices: noticesRes.rows,
    upcoming_exams: upcomingExamsRes.rows,
    recent_results: recentResultsRes.rows,
    upcoming_holidays: holidaysRes.rows,
  };
};

exports.checkInTeacher = async (req) => {
  const centerId = req.user.center_id;
  const teacherId = ensureTeacherUser(req);
  const { latitude, longitude } = req.body || {};
  await getTeacherProfile(centerId, teacherId);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingRes = await client.query(
      `
      SELECT id, check_in_at, check_out_at, total_minutes, status
      FROM teacher_daily_attendance
      WHERE center_id = $1
        AND teacher_id = $2
        AND attendance_date = CURRENT_DATE
      FOR UPDATE
      `,
      [centerId, teacherId]
    );

    const existing = existingRes.rows[0];
    if (existing && existing.check_in_at && !existing.check_out_at) {
      throw createError("You are already checked in for today.", 400);
    }

    if (existing && existing.check_out_at) {
      throw createError("Today's attendance is already completed.", 400);
    }

    const { rows } = await client.query(
      `
      INSERT INTO teacher_daily_attendance
        (center_id, teacher_id, attendance_date, check_in_at, check_in_latitude, check_in_longitude, status)
      VALUES
        ($1, $2, CURRENT_DATE, NOW(), $3, $4, 'checked_in')
      RETURNING *
      `,
      [centerId, teacherId, latitude ?? null, longitude ?? null]
    );

    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.checkOutTeacher = async (req) => {
  const centerId = req.user.center_id;
  const teacherId = ensureTeacherUser(req);
  const { latitude, longitude } = req.body || {};
  await getTeacherProfile(centerId, teacherId);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingRes = await client.query(
      `
      SELECT id, check_in_at, check_out_at
      FROM teacher_daily_attendance
      WHERE center_id = $1
        AND teacher_id = $2
        AND attendance_date = CURRENT_DATE
      FOR UPDATE
      `,
      [centerId, teacherId]
    );

    const existing = existingRes.rows[0];
    if (!existing || !existing.check_in_at) {
      throw createError("Check-in is required before check-out.", 400);
    }

    if (existing.check_out_at) {
      throw createError("You have already checked out for today.", 400);
    }

    const { rows } = await client.query(
      `
      UPDATE teacher_daily_attendance
      SET
        check_out_at = NOW(),
        check_out_latitude = $1,
        check_out_longitude = $2,
        total_minutes = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - check_in_at)) / 60)),
        status = 'checked_out',
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
      `,
      [latitude ?? null, longitude ?? null, existing.id]
    );

    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
