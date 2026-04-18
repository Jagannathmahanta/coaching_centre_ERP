const pool = require("../../config/db");
const bcrypt = require("bcryptjs");
const {
  createAppError,
  getDefaultAcademicYear,
  createStudentFeePlan,
} = require("../fees/fees.shared");
const { buildStudentPassword, resolveAdmissionSelection } = require("../catalog/catalog.shared");
const { syncStudentHostelAllocation } = require("../hostel/hostel.service");
const { deleteObjectByUrl, getSignedObjectUrl, sanitizeSegment, uploadDataUrl } = require("../../utils/s3Upload");

const ALLOWED_STUDENT_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);

async function resolveCenterSlug(client, req) {
  if (req.user.center_slug) {
    return String(req.user.center_slug).trim().toLowerCase();
  }

  const { rows } = await client.query(
    `
    SELECT slug
    FROM coaching_centers
    WHERE id = $1
    LIMIT 1
    `,
    [req.user.center_id]
  );

  if (!rows[0] || !rows[0].slug) {
    throw createAppError("Institute slug not found.", 404);
  }

  return String(rows[0].slug).trim().toLowerCase();
}

async function uploadStudentPhoto(client, req, studentId, photoPayload) {
  if (!photoPayload || !photoPayload.content) {
    return null;
  }

  const centerSlug = await resolveCenterSlug(client, req);
  return uploadDataUrl({
    keyPrefix: `${sanitizeSegment(centerSlug)}/students/student-${studentId}`,
    fileNamePrefix: "profile",
    dataUrl: photoPayload.content,
    originalName: photoPayload.name || `student-${studentId}-profile`,
    allowedMimeTypes: ALLOWED_STUDENT_IMAGE_TYPES,
    maxBytes: 5 * 1024 * 1024,
  });
}

const createLinkedUser = async (client, req, payload) => {
  const {
    role,
    name,
    email,
    phone,
    password,
    studentId,
    parentId,
    mustChangePassword,
  } = payload;

  const normalizedEmail = String(email || "").trim().toLowerCase() || null;
  const normalizedPhone = String(phone || "").trim() || null;

  if (!normalizedEmail && !normalizedPhone) {
    throw createAppError("Email or mobile is required to create a login account.");
  }

  if (!password || String(password).length < 6) {
    throw createAppError("Password must be at least 6 characters.");
  }

  const existingUser = await client.query(
    `
    SELECT id
    FROM users
    WHERE ($1::text IS NOT NULL AND email = $1)
       OR ($2::text IS NOT NULL AND phone = $2)
       OR ($3::int IS NOT NULL AND student_id = $3)
       OR ($4::int IS NOT NULL AND parent_id = $4)
    LIMIT 1
    `,
    [normalizedEmail, normalizedPhone, studentId || null, parentId || null]
  );

  if (existingUser.rows[0]) {
    throw createAppError("A login account already exists for this email, mobile, or linked profile.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await client.query(
    `
    INSERT INTO users
      (name, email, phone, password_hash, role, center_id, student_id, parent_id, must_change_password)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `,
    [
      name,
      normalizedEmail,
      normalizedPhone,
      passwordHash,
      role,
      req.user.center_id,
      studentId || null,
      parentId || null,
      Boolean(mustChangePassword),
    ]
  );
};

const buildAdmissionNumber = async (client, centerId, joinDate) => {
  const date = new Date(joinDate || new Date());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `${year}${month}`;

  const { rows } = await client.query(
    `
    SELECT roll_number
    FROM students
    WHERE center_id = $1
      AND roll_number LIKE $2
    ORDER BY roll_number DESC
    LIMIT 1
    `,
    [centerId, `${prefix}%`]
  );

  const lastNumber = rows[0] && rows[0].roll_number
    ? Number(String(rows[0].roll_number).slice(-3))
    : 0;

  return `${prefix}${String(lastNumber + 1).padStart(3, "0")}`;
};

exports.getStudents = async (req) => {
  const { class: className, board, academic_year, program_type, class_id, course_id, batch_id, status } = req.query;
  let query = `
    SELECT
      s.*,
      u.id AS user_id,
      u.email AS login_email,
      u.phone AS login_phone,
      CASE WHEN u.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_login_account,
      fp.billing_cycle,
      fp.include_hostel,
      fp.include_transport,
      fp.tuition_fee_total,
      fp.hostel_fee_total,
      fp.transport_fee_total,
      fp.applicable_months,
      fp.status AS fee_plan_status,
      fs.name AS fee_definition_name,
      fs.program_type,
      fs.board,
      fs.academic_year,
      cd.class_name AS class_label,
      cr.course_name AS course_label,
      bd.batch_name,
      bd.shift AS batch_shift,
      bd.start_time AS batch_start_time,
      bd.end_time AS batch_end_time,
      h.hostel_name,
      hr.room_number,
      COALESCE(fee_state.overdue_count, 0) AS overdue_count,
      COALESCE(fee_state.current_due_count, 0) AS current_due_count
    FROM students s
    LEFT JOIN users u
      ON u.student_id = s.id
     AND u.center_id = s.center_id
    LEFT JOIN student_fee_profiles fp
      ON fp.student_id = s.id
     AND fp.center_id = s.center_id
     AND fp.status = 'active'
    LEFT JOIN fee_structures fs
      ON fs.id = fp.fee_structure_id
    LEFT JOIN class_definitions cd
      ON cd.id = s.class_id
    LEFT JOIN course_definitions cr
      ON cr.id = s.course_id
    LEFT JOIN batch_definitions bd
      ON bd.id = s.batch_id
    LEFT JOIN student_allocations sa
      ON sa.student_id = s.id
     AND sa.center_id = s.center_id
     AND sa.type = 'hostel'
     AND sa.status = 'active'
     AND sa.end_date IS NULL
    LEFT JOIN hostels h ON h.id = sa.hostel_id
    LEFT JOIN hostel_rooms hr ON hr.id = sa.room_id
    LEFT JOIN (
      SELECT
        student_id,
        COUNT(*) FILTER (WHERE status IN ('pending', 'partial') AND due_date < date_trunc('month', CURRENT_DATE)) AS overdue_count,
        COUNT(*) FILTER (WHERE status IN ('pending', 'partial') AND date_trunc('month', due_date) = date_trunc('month', CURRENT_DATE)) AS current_due_count
      FROM fees
      WHERE center_id = $1
      GROUP BY student_id
    ) fee_state
      ON fee_state.student_id = s.id
    WHERE s.center_id = $1
  `;
  const params = [req.user.center_id];

  if (className) {
    params.push(className);
    query += ` AND COALESCE(cd.class_name, s.class) = $${params.length}`;
  }

  if (board) {
    params.push(board);
    query += ` AND COALESCE(s.board, fs.board) = $${params.length}`;
  }

  if (academic_year) {
    params.push(academic_year);
    query += ` AND fs.academic_year = $${params.length}`;
  }

  if (program_type) {
    params.push(program_type);
    query += ` AND COALESCE(s.program_type, fs.program_type, 'academic') = $${params.length}`;
  }

  if (class_id) {
    params.push(Number(class_id));
    query += ` AND s.class_id = $${params.length}`;
  }

  if (course_id) {
    params.push(Number(course_id));
    query += ` AND s.course_id = $${params.length}`;
  }

  if (batch_id) {
    params.push(Number(batch_id));
    query += ` AND s.batch_id = $${params.length}`;
  }

  if (status && status !== "all") {
    params.push(String(status));
    query += ` AND s.status = $${params.length}`;
  }

  query += " ORDER BY s.created_at DESC";

  const { rows } = await pool.query(
    query,
    params
  );
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      photo_url: await getSignedObjectUrl(row.photo_url),
    }))
  );
};

exports.getStudentById = async (req) => {
  const studentId = Number(req.params.id);
  const { rows } = await pool.query(
    `
    SELECT
      s.*,
      p.name AS parent_name,
      p.phone AS parent_phone,
      p.email AS parent_email,
      fp.fee_structure_id,
      fp.billing_cycle,
      fp.include_hostel,
      fp.include_transport,
      fp.due_day,
      fp.notes,
      fp.status AS fee_plan_status,
      fs.name AS fee_definition_name,
      fs.board,
      fs.academic_year,
      cd.class_name AS class_label,
      cr.course_name AS course_label,
      bd.batch_name,
      bd.shift AS batch_shift,
      bd.start_time AS batch_start_time,
      bd.end_time AS batch_end_time,
      sa.hostel_id,
      sa.room_id,
      sa.start_date AS hostel_join_date,
      sa.end_date AS hostel_left_date,
      h.hostel_name,
      hr.room_number
    FROM students s
    LEFT JOIN student_fee_profiles fp
      ON fp.student_id = s.id
     AND fp.center_id = s.center_id
     AND fp.status = 'active'
    LEFT JOIN parents p
      ON p.id = s.parent_id
    LEFT JOIN fee_structures fs
      ON fs.id = fp.fee_structure_id
    LEFT JOIN class_definitions cd
      ON cd.id = s.class_id
    LEFT JOIN course_definitions cr
      ON cr.id = s.course_id
    LEFT JOIN batch_definitions bd
      ON bd.id = s.batch_id
    LEFT JOIN student_allocations sa
      ON sa.student_id = s.id
     AND sa.center_id = s.center_id
     AND sa.type = 'hostel'
     AND sa.status = 'active'
     AND sa.end_date IS NULL
    LEFT JOIN hostels h ON h.id = sa.hostel_id
    LEFT JOIN hostel_rooms hr ON hr.id = sa.room_id
    WHERE s.id = $1
      AND s.center_id = $2
    `,
    [studentId, req.user.center_id]
  );

  if (!rows[0]) {
    throw createAppError("Student not found.", 404);
  }

  return {
    ...rows[0],
    photo_url: await getSignedObjectUrl(rows[0].photo_url),
  };
};

exports.createStudent = async (req) => {
    const {
      name,
    class: className,
    phone,
    email,
    gender,
    parent_name,
    parent_phone,
    parent_email,
    join_date,
    billing_cycle,
    academic_year,
    due_day,
    notes,
    fee_structure_id,
    include_hostel,
    hostel_id,
    room_id,
    include_transport,
    create_fee_plan,
    program_type,
    board,
    class_id,
    course_id,
    batch_id,
      admission_year,
      photo,
    } = req.body;

  if (!name) {
    throw createAppError("name is required.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let parentId = null;
    const normalizedParentName = String(parent_name || "").trim();
    const normalizedParentPhone = String(parent_phone || "").trim();
    const normalizedParentEmail = String(parent_email || "").trim().toLowerCase();

    if (normalizedParentName || normalizedParentPhone || normalizedParentEmail) {
      if (!normalizedParentName || !normalizedParentPhone) {
        throw createAppError("Guardian name and mobile are required together.");
      }

      const existingParent = await client.query(
        `
        SELECT id
        FROM parents
        WHERE phone = $1 AND center_id = $2
        LIMIT 1
        `,
        [normalizedParentPhone, req.user.center_id]
      );

      if (existingParent.rows[0]) {
        parentId = existingParent.rows[0].id;
      } else {
        const { rows: parentRows } = await client.query(
          `
          INSERT INTO parents (name, phone, email, center_id)
          VALUES ($1, $2, $3, $4)
          RETURNING id
          `,
          [normalizedParentName, normalizedParentPhone, normalizedParentEmail || null, req.user.center_id]
        );
        parentId = parentRows[0].id;
      }
    }

    const selection = await resolveAdmissionSelection(client, req.user.center_id, req.body);
    if (!selection.isStructured && !className) {
      throw createAppError("class is required for legacy admissions.");
    }
    const admissionNumber = await buildAdmissionNumber(client, req.user.center_id, join_date);
    const { rows: studentRows } = await client.query(
      `
      INSERT INTO students (
        name,
        class,
        phone,
        email,
        gender,
        photo_url,
        parent_id,
        roll_number,
        join_date,
        center_id,
        program_type,
        board,
        class_id,
        course_id,
        batch_id,
        admission_year
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_DATE), $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
      `,
      [
        name,
        selection.legacyClassValue || className,
        phone || null,
        String(email || "").trim().toLowerCase() || null,
        gender || null,
        null,
        parentId,
        admissionNumber,
        join_date || null,
        req.user.center_id,
        selection.programType,
        selection.board,
        selection.classRow ? selection.classRow.id : null,
        selection.courseRow ? selection.courseRow.id : null,
        selection.batchRow ? selection.batchRow.id : null,
        selection.admissionYear || null,
      ]
    );

    let student = studentRows[0];

    if (photo && photo.content) {
      const uploadedPhoto = await uploadStudentPhoto(client, req, student.id, photo);
      const updatedPhoto = await client.query(
        `
        UPDATE students
        SET photo_url = $1, updated_at = NOW()
        WHERE id = $2 AND center_id = $3
        RETURNING *
        `,
        [uploadedPhoto.url, student.id, req.user.center_id]
      );
      student = updatedPhoto.rows[0];
    }

    let feePlan = null;
    const shouldCreateFeePlan = create_fee_plan !== false && Boolean(billing_cycle) && Boolean(fee_structure_id);
    if (shouldCreateFeePlan) {
      feePlan = await createStudentFeePlan(client, req, {
        studentId: student.id,
        fee_structure_id,
        billing_cycle,
        academic_year: academic_year || getDefaultAcademicYear(),
        due_day,
        include_transport: Boolean(include_transport),
        include_hostel: Boolean(include_hostel),
        plan_start_date: join_date || student.join_date,
        notes,
      });
    }

    await syncStudentHostelAllocation(client, req, {
      studentId: student.id,
      includeHostel: Boolean(include_hostel),
      hostelId: hostel_id,
      roomId: room_id,
      startDate: join_date || student.join_date,
    });

    const normalizedStudentPhone = String(phone || "").trim();
    const normalizedStudentEmail = String(email || "").trim().toLowerCase();
    const studentPassword = buildStudentPassword(student.name, student.admission_year);

    if (normalizedStudentPhone || normalizedStudentEmail) {
      const existingStudentLogin = await client.query(
        `
        SELECT id
        FROM users
        WHERE student_id = $1
           OR ($2::text IS NOT NULL AND email = $2)
           OR ($3::text IS NOT NULL AND phone = $3)
        LIMIT 1
        `,
        [student.id, normalizedStudentEmail || null, normalizedStudentPhone || null]
      );

      if (!existingStudentLogin.rows[0]) {
        await createLinkedUser(client, req, {
          role: "student",
          name: student.name,
          email: normalizedStudentEmail,
          phone: normalizedStudentPhone,
          password: studentPassword,
          studentId: student.id,
          mustChangePassword: false,
        });
      }
    }

    const shouldCreateParentLogin =
      Boolean(parentId) &&
      (
        (normalizedParentPhone && normalizedParentPhone !== normalizedStudentPhone) ||
        (normalizedParentEmail && normalizedParentEmail !== normalizedStudentEmail)
      );

    if (shouldCreateParentLogin && parentId) {
      const existingParentLogin = await client.query(
        `
        SELECT id
        FROM users
        WHERE parent_id = $1
           OR ($2::text IS NOT NULL AND email = $2)
           OR ($3::text IS NOT NULL AND phone = $3)
        LIMIT 1
        `,
        [parentId, normalizedParentEmail || null, normalizedParentPhone || null]
      );

      if (!existingParentLogin.rows[0]) {
        await createLinkedUser(client, req, {
          role: "parent",
          name: normalizedParentName,
          email: normalizedParentEmail,
          phone: normalizedParentPhone,
          password: studentPassword,
          parentId,
        });
      }
    }

    await client.query("COMMIT");

    return {
      student: {
        ...student,
        photo_url: await getSignedObjectUrl(student.photo_url),
      },
      fee_plan: feePlan,
      parent_id: parentId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.updateStudent = async (req) => {
  const studentId = Number(req.params.id);
  const { name, class: className, phone, email, gender, join_date, include_hostel, hostel_id, room_id, parent_name, parent_phone, parent_email, status, left_date, left_reason, photo } = req.body;

  if (!studentId) {
    throw createAppError("Student id is required.");
  }

  if (!name) {
    throw createAppError("name is required.");
  }

  const selection = await resolveAdmissionSelection(pool, req.user.center_id, req.body);
  if (!selection.isStructured && !className) {
    throw createAppError("class is required for legacy admissions.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingStudentRes = await client.query(
      `
      SELECT s.*, p.name AS parent_name, p.phone AS parent_phone, p.email AS parent_email
      FROM students s
      LEFT JOIN parents p ON p.id = s.parent_id
      WHERE s.id = $1
        AND s.center_id = $2
      FOR UPDATE OF s
      `,
      [studentId, req.user.center_id]
    );

    const existingStudent = existingStudentRes.rows[0];
    if (!existingStudent) {
      throw createAppError("Student not found.", 404);
    }

    const requestedProgramType = selection.isStructured
      ? selection.programType
      : String(existingStudent.program_type || "academic").trim().toLowerCase();
    const requestedClassId = selection.isStructured && selection.programType === "academic"
      ? Number(selection.classRow && selection.classRow.id ? selection.classRow.id : 0) || null
      : null;
    const requestedCourseId = selection.isStructured && selection.programType === "non_academic"
      ? Number(selection.courseRow && selection.courseRow.id ? selection.courseRow.id : 0) || null
      : null;
    const isProgramChanged = requestedProgramType !== String(existingStudent.program_type || "academic").trim().toLowerCase();
    const isClassChanged = requestedProgramType === "academic"
      && Number(existingStudent.class_id || 0) !== Number(requestedClassId || 0);
    const isCourseChanged = requestedProgramType === "non_academic"
      && Number(existingStudent.course_id || 0) !== Number(requestedCourseId || 0);
    const isProgramSelectionChanged = selection.isStructured && (isProgramChanged || isClassChanged || isCourseChanged);

    if (isProgramSelectionChanged) {
      const switchStartDate = new Date();
      switchStartDate.setDate(1);
      const effectiveSwitchDate = switchStartDate.toISOString().slice(0, 10);
      const pendingFeeCheck = await client.query(
        `
        SELECT COUNT(*) AS pending_count
        FROM fees f
        JOIN student_fee_profiles fp
          ON fp.id = f.fee_profile_id
         AND fp.center_id = f.center_id
        WHERE fp.student_id = $1
          AND fp.center_id = $2
          AND fp.status = 'active'
          AND f.period_start < $3
          AND f.status IN ('pending', 'partial')
          AND COALESCE(f.balance, 0) > 0
        `,
        [studentId, req.user.center_id, effectiveSwitchDate]
      );

      if (Number(pendingFeeCheck.rows[0] ? pendingFeeCheck.rows[0].pending_count : 0) > 0) {
        throw createAppError("This student has pending fees before the switch month. Clear the previous class/course dues before switching.");
      }
    }

    let parentId = existingStudent.parent_id || null;
    const normalizedParentName = String(parent_name || "").trim();
    const normalizedParentPhone = String(parent_phone || "").trim();
    const normalizedParentEmail = String(parent_email || "").trim().toLowerCase();
    const normalizedStatus = String(status || existingStudent.status || "active").trim().toLowerCase();
    if (!["active", "inactive", "left"].includes(normalizedStatus)) {
      throw createAppError("status must be active, inactive, or left.");
    }

    if (normalizedParentName || normalizedParentPhone || normalizedParentEmail) {
      if (!normalizedParentName || !normalizedParentPhone) {
        throw createAppError("Guardian name and mobile are required together.");
      }

      if (parentId) {
        await client.query(
          `
          UPDATE parents
          SET name = $1,
              phone = $2,
              email = $3
          WHERE id = $4
            AND center_id = $5
          `,
          [normalizedParentName, normalizedParentPhone, normalizedParentEmail || null, parentId, req.user.center_id]
        );
      } else {
        const existingParent = await client.query(
          `
          SELECT id
          FROM parents
          WHERE phone = $1 AND center_id = $2
          LIMIT 1
          `,
          [normalizedParentPhone, req.user.center_id]
        );

        if (existingParent.rows[0]) {
          parentId = existingParent.rows[0].id;
        } else {
          const { rows: parentRows } = await client.query(
            `
            INSERT INTO parents (name, phone, email, center_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            `,
            [normalizedParentName, normalizedParentPhone, normalizedParentEmail || null, req.user.center_id]
          );
          parentId = parentRows[0].id;
        }
      }
    }

    const { rows } = await client.query(
      `
      UPDATE students
      SET
        name = $1,
        class = $2,
        phone = $3,
        email = $4,
        gender = $5,
        photo_url = COALESCE($6, photo_url),
        parent_id = $7,
        status = $8,
        left_date = $9,
        left_reason = $10,
        join_date = COALESCE($11, join_date),
        program_type = COALESCE($12, program_type),
        board = COALESCE($13, board),
        class_id = COALESCE($14, class_id),
        course_id = COALESCE($15, course_id),
        batch_id = COALESCE($16, batch_id),
        admission_year = COALESCE($17, admission_year),
        updated_at = NOW()
      WHERE id = $18
        AND center_id = $19
      RETURNING *
      `,
      [
        name,
        selection.legacyClassValue || className,
        phone || null,
        String(email || "").trim().toLowerCase() || null,
        gender || null,
        null,
        parentId,
        normalizedStatus,
        normalizedStatus === "active" ? null : (left_date || existingStudent.left_date || new Date().toISOString().slice(0, 10)),
        normalizedStatus === "active" ? null : (String(left_reason || "").trim() || existingStudent.left_reason || null),
        join_date || null,
        selection.programType,
        selection.board,
        selection.classRow ? selection.classRow.id : null,
        selection.courseRow ? selection.courseRow.id : null,
        selection.batchRow ? selection.batchRow.id : null,
        selection.admissionYear || null,
        studentId,
        req.user.center_id,
      ]
    );

    let updatedStudent = rows[0];

    if (photo && photo.content) {
      const uploadedPhoto = await uploadStudentPhoto(client, req, studentId, photo);
      const photoUpdated = await client.query(
        `
        UPDATE students
        SET photo_url = $1, updated_at = NOW()
        WHERE id = $2 AND center_id = $3
        RETURNING *
        `,
        [uploadedPhoto.url, studentId, req.user.center_id]
      );
      if (existingStudent.photo_url) {
        await deleteObjectByUrl(existingStudent.photo_url).catch(() => {});
      }
      updatedStudent = photoUpdated.rows[0];
    }

    if (include_hostel !== undefined) {
      await syncStudentHostelAllocation(client, req, {
        studentId,
        includeHostel: Boolean(include_hostel),
        hostelId: hostel_id,
        roomId: room_id,
        startDate: join_date || updatedStudent.join_date,
      });
    }

    await client.query("COMMIT");
    return {
      ...updatedStudent,
      photo_url: await getSignedObjectUrl(updatedStudent.photo_url),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.deactivateStudent = async (req) => {
  const studentId = Number(req.params.id);
  const leftDate = req.body.left_date || new Date().toISOString().slice(0, 10);
  const leftReason = String(req.body.left_reason || "").trim();

  if (!studentId) {
    throw createAppError("Student id is required.");
  }

  if (!leftReason) {
    throw createAppError("Reason is required to deactivate a student.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `
      UPDATE students
      SET
        status = 'inactive',
        left_date = $1,
        left_reason = $2,
        updated_at = NOW()
      WHERE id = $3
        AND center_id = $4
      RETURNING *
      `,
      [leftDate, leftReason, studentId, req.user.center_id]
    );

    if (!rows[0]) {
      throw createAppError("Student not found.", 404);
    }

    await syncStudentHostelAllocation(client, req, {
      studentId,
      includeHostel: false,
      hostelId: null,
      roomId: null,
      startDate: leftDate,
    });

    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.deleteStudent = async (req) => {
  const studentId = Number(req.params.id);
  if (!studentId) {
    throw createAppError("Student id is required.");
  }

  const existingStudent = await pool.query(
    `
    SELECT photo_url
    FROM students
    WHERE id = $1
      AND center_id = $2
    LIMIT 1
    `,
    [studentId, req.user.center_id]
  );

  if (!existingStudent.rows[0]) {
    throw createAppError("Student not found.", 404);
  }

  const paymentCheck = await pool.query(
    `
    SELECT COUNT(*) AS payment_count
    FROM fee_payments
    WHERE student_id = $1
      AND center_id = $2
    `,
    [studentId, req.user.center_id]
  );

  if (Number(paymentCheck.rows[0] ? paymentCheck.rows[0].payment_count : 0) > 0) {
    throw createAppError("This student already has payment history and cannot be deleted.");
  }

  const { rows } = await pool.query(
    `
    DELETE FROM students
    WHERE id = $1
      AND center_id = $2
    RETURNING id
    `,
    [studentId, req.user.center_id]
  );

  if (!rows[0]) {
    throw createAppError("Student not found.", 404);
  }

  if (existingStudent.rows[0].photo_url) {
    await deleteObjectByUrl(existingStudent.rows[0].photo_url).catch(() => {});
  }

  return { success: true };
};
