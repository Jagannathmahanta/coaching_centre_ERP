const pool = require("../../config/db");

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureManageAccess(req) {
  const role = String(req.user?.role || "").toLowerCase();
  if (!["admin", "staff", "teacher"].includes(role)) {
    throw createError("Only admin, staff, or teacher can update attendance.", 403);
  }
}

exports.getRoster = async (req) => {
  const { class: className, session, date, student_id } = req.query;
  const attendanceDate = date || new Date().toISOString().slice(0, 10);

  if (!className && !student_id) {
    throw createError("Class or student is required to load attendance.");
  }

  let query = `
    SELECT
      s.id AS student_id,
      s.name,
      s.class,
      s.roll_number,
      fs.academic_year,
      sa.id AS attendance_id,
      COALESCE(sa.status, 'present') AS status,
      sa.remarks,
      sa.attendance_date,
      sa.academic_session
    FROM students s
    LEFT JOIN student_fee_profiles fp
      ON fp.student_id = s.id
     AND fp.center_id = s.center_id
     AND fp.status = 'active'
    LEFT JOIN fee_structures fs
      ON fs.id = fp.fee_structure_id
    LEFT JOIN student_attendance sa
      ON sa.student_id = s.id
     AND sa.center_id = s.center_id
     AND sa.attendance_date = $2
     AND sa.academic_session = $3
    WHERE s.center_id = $1
      AND s.status = 'active'
  `;
  const params = [req.user.center_id, attendanceDate, session || ""];

  if (className) {
    params.push(className);
    query += ` AND s.class = $${params.length}`;
  }

  if (student_id) {
    params.push(Number(student_id));
    query += ` AND s.id = $${params.length}`;
  }

  if (session) {
    params.push(session);
    query += ` AND (fs.academic_year = $${params.length} OR fs.academic_year IS NULL)`;
  }

  query += " ORDER BY s.name";

  const { rows } = await pool.query(query, params);
  return rows;
};

exports.saveAttendance = async (req) => {
  ensureManageAccess(req);

  const { date, session, records } = req.body;
  const attendanceDate = date || new Date().toISOString().slice(0, 10);

  if (!Array.isArray(records) || records.length === 0) {
    throw createError("Attendance records are required.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const record of records) {
      if (!record.student_id || !["present", "absent", "leave"].includes(record.status)) {
        throw createError("Each attendance row needs a valid student and status.");
      }

      await client.query(
        `
        INSERT INTO student_attendance
          (center_id, student_id, attendance_date, academic_session, status, remarks, marked_by)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (student_id, attendance_date, academic_session)
        DO UPDATE SET
          status = EXCLUDED.status,
          remarks = EXCLUDED.remarks,
          marked_by = EXCLUDED.marked_by,
          updated_at = NOW()
        `,
        [
          req.user.center_id,
          Number(record.student_id),
          attendanceDate,
          session || "",
          record.status,
          record.remarks || null,
          req.user.id,
        ]
      );
    }

    await client.query("COMMIT");
    return { success: true, saved_count: records.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.getHistory = async (req) => {
  const { class: className, session, student_id, from_date, to_date } = req.query;

  let query = `
    SELECT
      sa.*,
      s.name,
      s.class,
      s.roll_number
    FROM student_attendance sa
    JOIN students s
      ON s.id = sa.student_id
     AND s.center_id = sa.center_id
    WHERE sa.center_id = $1
  `;
  const params = [req.user.center_id];

  if (className) {
    params.push(className);
    query += ` AND s.class = $${params.length}`;
  }

  if (student_id) {
    params.push(Number(student_id));
    query += ` AND sa.student_id = $${params.length}`;
  }

  if (session) {
    params.push(session);
    query += ` AND sa.academic_session = $${params.length}`;
  }

  if (from_date) {
    params.push(from_date);
    query += ` AND sa.attendance_date >= $${params.length}`;
  }

  if (to_date) {
    params.push(to_date);
    query += ` AND sa.attendance_date <= $${params.length}`;
  }

  query += " ORDER BY sa.attendance_date DESC, s.name";

  const { rows } = await pool.query(query, params);
  return rows;
};
