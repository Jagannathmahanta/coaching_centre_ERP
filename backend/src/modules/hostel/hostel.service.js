const pool = require("../../config/db");

const createAppError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeStudentGender = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["male", "boy", "boys"].includes(normalized)) return "boys";
  if (["female", "girl", "girls"].includes(normalized)) return "girls";
  return "";
};

const getHostelById = async (client, centerId, hostelId, lock = false) => {
  const { rows } = await client.query(
    `
    SELECT *
    FROM hostels
    WHERE id = $1
      AND center_id = $2
    ${lock ? "FOR UPDATE" : ""}
    `,
    [hostelId, centerId]
  );

  if (!rows[0]) {
    throw createAppError("Hostel not found.", 404);
  }

  return rows[0];
};

const getRoomById = async (client, centerId, roomId, lock = false) => {
  const { rows } = await client.query(
    `
    SELECT r.*, h.hostel_name, h.gender_type, h.status AS hostel_status
    FROM hostel_rooms r
    JOIN hostels h ON h.id = r.hostel_id
    WHERE r.id = $1
      AND r.center_id = $2
    ${lock ? "FOR UPDATE" : ""}
    `,
    [roomId, centerId]
  );

  if (!rows[0]) {
    throw createAppError("Room not found.", 404);
  }

  return rows[0];
};

const getActiveHostelAllocation = async (client, centerId, studentId, lock = false) => {
  const { rows } = await client.query(
    `
    SELECT sa.*, h.hostel_name, h.gender_type, r.room_number
    FROM student_allocations sa
    LEFT JOIN hostels h ON h.id = sa.hostel_id
    LEFT JOIN hostel_rooms r ON r.id = sa.room_id
    WHERE sa.student_id = $1
      AND sa.center_id = $2
      AND sa.type = 'hostel'
      AND sa.status = 'active'
      AND sa.end_date IS NULL
    ${lock ? "FOR UPDATE OF sa" : ""}
    `,
    [studentId, centerId]
  );

  return rows[0] || null;
};

const releaseStudentHostelAllocation = async (client, req, options) => {
  const activeAllocation = await getActiveHostelAllocation(client, req.user.center_id, options.studentId, true);
  if (!activeAllocation) return null;

  await client.query(
    `
    UPDATE student_allocations
    SET end_date = $1,
        status = 'completed'
    WHERE id = $2
    `,
    [options.endDate || new Date().toISOString().slice(0, 10), activeAllocation.id]
  );

  if (activeAllocation.room_id) {
    await client.query(
      `
      UPDATE hostel_rooms
      SET occupied = GREATEST(occupied - 1, 0),
          updated_at = NOW()
      WHERE id = $1
        AND center_id = $2
      `,
      [activeAllocation.room_id, req.user.center_id]
    );
  }

  return activeAllocation;
};

const assignStudentHostelAllocation = async (client, req, options) => {
  const studentId = Number(options.studentId);
  const hostelId = Number(options.hostelId);
  const roomId = Number(options.roomId);
  if (!studentId || !hostelId || !roomId) {
    throw createAppError("studentId, hostelId, and roomId are required for hostel allocation.");
  }

  const { rows: studentRows } = await client.query(
    `
    SELECT id, name, gender
    FROM students
    WHERE id = $1
      AND center_id = $2
    `,
    [studentId, req.user.center_id]
  );

  const student = studentRows[0];
  if (!student) {
    throw createAppError("Student not found.", 404);
  }

  const studentGender = normalizeStudentGender(student.gender);
  if (!studentGender) {
    throw createAppError("Student gender is required before assigning hostel.");
  }

  const hostel = await getHostelById(client, req.user.center_id, hostelId, true);
  if (hostel.status !== "active") {
    throw createAppError("Selected hostel is inactive.");
  }
  if (hostel.gender_type !== studentGender) {
    throw createAppError(`This student can only be assigned to ${studentGender} hostels.`);
  }

  const room = await getRoomById(client, req.user.center_id, roomId, true);
  if (Number(room.hostel_id) !== hostelId) {
    throw createAppError("Selected room does not belong to the chosen hostel.");
  }
  if (room.status !== "active") {
    throw createAppError("Selected room is inactive.");
  }
  if (Number(room.occupied) >= Number(room.capacity)) {
    throw createAppError("Selected room is already full.");
  }

  const activeAllocation = await getActiveHostelAllocation(client, req.user.center_id, studentId, true);
  if (activeAllocation) {
    if (Number(activeAllocation.room_id) === roomId && Number(activeAllocation.hostel_id) === hostelId) {
      return activeAllocation;
    }

    await releaseStudentHostelAllocation(client, req, {
      studentId,
      endDate: options.startDate || new Date().toISOString().slice(0, 10),
    });
  }

  const { rows } = await client.query(
    `
    INSERT INTO student_allocations (
      student_id,
      hostel_id,
      room_id,
      type,
      center_id,
      start_date,
      status
    )
    VALUES ($1,$2,$3,'hostel',$4,$5,'active')
    RETURNING *
    `,
    [studentId, hostelId, roomId, req.user.center_id, options.startDate || new Date().toISOString().slice(0, 10)]
  );

  await client.query(
    `
    UPDATE hostel_rooms
    SET occupied = occupied + 1,
        updated_at = NOW()
    WHERE id = $1
      AND center_id = $2
    `,
    [roomId, req.user.center_id]
  );

  return rows[0];
};

exports.getHostels = async (req) => {
  const { gender_type, status } = req.query;
  let query = `
    SELECT
      h.*,
      COUNT(r.id) AS total_rooms,
      COALESCE(SUM(r.capacity), 0) AS total_capacity,
      COALESCE(SUM(r.occupied), 0) AS occupied_beds,
      COALESCE(SUM(r.capacity - r.occupied), 0) AS vacant_beds
    FROM hostels h
    LEFT JOIN hostel_rooms r ON r.hostel_id = h.id
    WHERE h.center_id = $1
  `;
  const params = [req.user.center_id];

  if (gender_type) {
    params.push(gender_type);
    query += ` AND h.gender_type = $${params.length}`;
  }

  if (status) {
    params.push(status);
    query += ` AND h.status = $${params.length}`;
  }

  query += " GROUP BY h.id ORDER BY h.hostel_name";
  const { rows } = await pool.query(query, params);
  return rows;
};

exports.createHostel = async (req) => {
  const { hostel_name, gender_type, address, status } = req.body;
  if (!hostel_name || !gender_type) {
    throw createAppError("hostel_name and gender_type are required.");
  }

  const { rows } = await pool.query(
    `
    INSERT INTO hostels (
      hostel_name,
      gender_type,
      address,
      status,
      center_id
    )
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [hostel_name, gender_type, address || null, status || "active", req.user.center_id]
  );

  return rows[0];
};

exports.updateHostel = async (req) => {
  const hostelId = Number(req.params.id);
  const { hostel_name, gender_type, address, status } = req.body;
  const { rows } = await pool.query(
    `
    UPDATE hostels
    SET hostel_name = $1,
        gender_type = $2,
        address = $3,
        status = $4,
        updated_at = NOW()
    WHERE id = $5
      AND center_id = $6
    RETURNING *
    `,
    [hostel_name, gender_type, address || null, status || "active", hostelId, req.user.center_id]
  );

  if (!rows[0]) {
    throw createAppError("Hostel not found.", 404);
  }

  return rows[0];
};

exports.deleteHostel = async (req) => {
  const hostelId = Number(req.params.id);
  const usageResult = await pool.query(
    `
    SELECT COUNT(*) AS active_count
    FROM student_allocations
    WHERE hostel_id = $1
      AND center_id = $2
      AND type = 'hostel'
      AND status = 'active'
      AND end_date IS NULL
    `,
    [hostelId, req.user.center_id]
  );

  if (Number(usageResult.rows[0] ? usageResult.rows[0].active_count : 0) > 0) {
    throw createAppError("This hostel has active student allocations. Deactivate or release them first.");
  }

  const roomUsage = await pool.query(
    `
    SELECT COUNT(*) AS room_count
    FROM hostel_rooms
    WHERE hostel_id = $1
      AND center_id = $2
    `,
    [hostelId, req.user.center_id]
  );

  if (Number(roomUsage.rows[0] ? roomUsage.rows[0].room_count : 0) > 0) {
    throw createAppError("Delete or move the hostel rooms first.");
  }

  const { rows } = await pool.query(
    `
    DELETE FROM hostels
    WHERE id = $1
      AND center_id = $2
    RETURNING id
    `,
    [hostelId, req.user.center_id]
  );

  if (!rows[0]) {
    throw createAppError("Hostel not found.", 404);
  }

  return { message: "Hostel deleted successfully." };
};

exports.getRooms = async (req) => {
  const { hostel_id, gender_type, available_only, status } = req.query;
  let query = `
    SELECT
      r.*,
      h.hostel_name,
      h.gender_type,
      (r.capacity - r.occupied) AS vacant_seats,
      COALESCE(
        json_agg(
          json_build_object(
            'allocation_id', sa.id,
            'student_id', s.id,
            'name', s.name,
            'class', s.class,
            'join_date', sa.start_date
          )
        ) FILTER (WHERE sa.id IS NOT NULL),
        '[]'
      ) AS occupants
    FROM hostel_rooms r
    JOIN hostels h ON h.id = r.hostel_id
    LEFT JOIN student_allocations sa
      ON sa.room_id = r.id
     AND sa.type = 'hostel'
     AND sa.status = 'active'
     AND sa.end_date IS NULL
    LEFT JOIN students s ON s.id = sa.student_id
    WHERE r.center_id = $1
  `;
  const params = [req.user.center_id];

  if (hostel_id) {
    params.push(Number(hostel_id));
    query += ` AND r.hostel_id = $${params.length}`;
  }

  if (gender_type) {
    params.push(gender_type);
    query += ` AND h.gender_type = $${params.length}`;
  }

  if (status) {
    params.push(status);
    query += ` AND r.status = $${params.length}`;
  }

  if (available_only === "true") {
    query += " AND r.occupied < r.capacity";
  }

  query += " GROUP BY r.id, h.hostel_name, h.gender_type ORDER BY h.hostel_name, r.room_number";
  const { rows } = await pool.query(query, params);
  return rows;
};

exports.createRoom = async (req) => {
  const {
    hostel_id,
    room_number,
    floor,
    type,
    capacity,
    monthly_fee,
    status,
  } = req.body;

  if (!hostel_id || !room_number || !capacity) {
    throw createAppError("hostel_id, room_number, and capacity are required.");
  }

  const client = await pool.connect();
  try {
    await getHostelById(client, req.user.center_id, Number(hostel_id));
    const { rows } = await client.query(
      `
      INSERT INTO hostel_rooms (
        hostel_id,
        room_number,
        floor,
        type,
        capacity,
        monthly_fee,
        status,
        center_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        Number(hostel_id),
        room_number,
        floor || null,
        type || null,
        Number(capacity),
        monthly_fee || null,
        status || "active",
        req.user.center_id,
      ]
    );

    return rows[0];
  } finally {
    client.release();
  }
};

exports.updateRoom = async (req) => {
  const roomId = Number(req.params.id);
  const {
    hostel_id,
    room_number,
    floor,
    type,
    capacity,
    monthly_fee,
    status,
  } = req.body;

  const roomResult = await pool.query(
    `
    SELECT occupied
    FROM hostel_rooms
    WHERE id = $1
      AND center_id = $2
    `,
    [roomId, req.user.center_id]
  );

  if (!roomResult.rows[0]) {
    throw createAppError("Room not found.", 404);
  }

  if (Number(capacity) < Number(roomResult.rows[0].occupied || 0)) {
    throw createAppError("Capacity cannot be lower than the current occupied seats.");
  }

  const { rows } = await pool.query(
    `
    UPDATE hostel_rooms
    SET hostel_id = $1,
        room_number = $2,
        floor = $3,
        type = $4,
        capacity = $5,
        monthly_fee = $6,
        status = $7,
        updated_at = NOW()
    WHERE id = $8
      AND center_id = $9
    RETURNING *
    `,
    [
      Number(hostel_id),
      room_number,
      floor || null,
      type || null,
      Number(capacity),
      monthly_fee || null,
      status || "active",
      roomId,
      req.user.center_id,
    ]
  );

  return rows[0];
};

exports.deleteRoom = async (req) => {
  const roomId = Number(req.params.id);
  const usageResult = await pool.query(
    `
    SELECT COUNT(*) AS active_count
    FROM student_allocations
    WHERE room_id = $1
      AND center_id = $2
      AND type = 'hostel'
      AND status = 'active'
      AND end_date IS NULL
    `,
    [roomId, req.user.center_id]
  );

  if (Number(usageResult.rows[0] ? usageResult.rows[0].active_count : 0) > 0) {
    throw createAppError("This room has active students. Release them first.");
  }

  const { rows } = await pool.query(
    `
    DELETE FROM hostel_rooms
    WHERE id = $1
      AND center_id = $2
    RETURNING id
    `,
    [roomId, req.user.center_id]
  );

  if (!rows[0]) {
    throw createAppError("Room not found.", 404);
  }

  return { message: "Room deleted successfully." };
};

exports.getAllocations = async (req) => {
  const { active_only } = req.query;
  let query = `
    SELECT
      sa.*,
      s.name AS student_name,
      s.class,
      s.roll_number,
      h.hostel_name,
      h.gender_type,
      r.room_number
    FROM student_allocations sa
    JOIN students s ON s.id = sa.student_id
    LEFT JOIN hostels h ON h.id = sa.hostel_id
    LEFT JOIN hostel_rooms r ON r.id = sa.room_id
    WHERE sa.center_id = $1
      AND sa.type = 'hostel'
  `;
  const params = [req.user.center_id];

  if (active_only === "true") {
    query += " AND sa.status = 'active' AND sa.end_date IS NULL";
  }

  query += " ORDER BY sa.start_date DESC, sa.created_at DESC";
  const { rows } = await pool.query(query, params);
  return rows;
};

exports.assignRoom = async (req) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const allocation = await assignStudentHostelAllocation(client, req, {
      studentId: req.body.student_id,
      hostelId: req.body.hostel_id,
      roomId: req.body.room_id,
      startDate: req.body.start_date,
    });
    await client.query("COMMIT");
    return allocation;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.releaseAllocation = async (req) => {
  const allocationId = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `
      SELECT *
      FROM student_allocations
      WHERE id = $1
        AND center_id = $2
        AND type = 'hostel'
      FOR UPDATE
      `,
      [allocationId, req.user.center_id]
    );

    const allocation = rows[0];
    if (!allocation) {
      throw createAppError("Hostel allocation not found.", 404);
    }
    if (allocation.status !== "active" || allocation.end_date) {
      throw createAppError("This hostel allocation is already closed.");
    }

    await releaseStudentHostelAllocation(client, req, {
      studentId: allocation.student_id,
      endDate: req.body.end_date || new Date().toISOString().slice(0, 10),
    });

    await client.query("COMMIT");
    return { message: "Hostel allocation released successfully." };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.syncStudentHostelAllocation = async (client, req, options) => {
  if (!options.includeHostel) {
    return releaseStudentHostelAllocation(client, req, {
      studentId: options.studentId,
      endDate: options.endDate || new Date().toISOString().slice(0, 10),
    });
  }

  if (!options.hostelId || !options.roomId) {
    throw createAppError("Select hostel and room for hostel students.");
  }

  return assignStudentHostelAllocation(client, req, {
    studentId: options.studentId,
    hostelId: options.hostelId,
    roomId: options.roomId,
    startDate: options.startDate,
  });
};

module.exports.createAppError = createAppError;
