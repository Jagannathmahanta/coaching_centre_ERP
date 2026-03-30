const pool = require("../../config/db");

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

exports.getHolidays = async (req) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM holidays
    WHERE center_id = $1
    ORDER BY start_date ASC, end_date ASC, id DESC
    `,
    [req.user.center_id]
  );

  return rows;
};

exports.createHoliday = async (req) => {
  const { title, description, start_date, end_date, status } = req.body;

  if (!title || !start_date || !end_date) {
    throw badRequest("Title, start date, and end date are required.");
  }

  if (new Date(end_date) < new Date(start_date)) {
    throw badRequest("End date cannot be before start date.");
  }

  const { rows } = await pool.query(
    `
    INSERT INTO holidays
    (title, description, start_date, end_date, status, center_id, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
    `,
    [
      title,
      description || null,
      start_date,
      end_date,
      status || "active",
      req.user.center_id,
      req.user.id,
    ]
  );

  return rows[0];
};

exports.deleteHoliday = async (req) => {
  await pool.query(
    `
    DELETE FROM holidays
    WHERE id = $1 AND center_id = $2
    `,
    [req.params.id, req.user.center_id]
  );

  return { success: true };
};
