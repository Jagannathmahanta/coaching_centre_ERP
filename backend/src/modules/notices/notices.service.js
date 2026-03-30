
const pool = require("../../config/db");

exports.getNotices = async (req) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM notices
    WHERE center_id=$1
    ORDER BY created_at DESC
    `,
    [req.user.center_id]
  );

  return rows;
};

exports.createNotice = async (req) => {
  const {
    title,
    content,
    target_audience,
    priority,
    expires_at,
  } = req.body;

  const { rows } = await pool.query(
    `
    INSERT INTO notices
    (title, content, target_audience, priority, expires_at, center_id, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
    `,
    [
      title,
      content,
      target_audience,
      priority,
      expires_at,
      req.user.center_id,
      req.user.id,
    ]
  );

  return rows[0];
};

exports.deleteNotice = async (req) => {
  await pool.query(
    `
    DELETE FROM notices
    WHERE id=$1 AND center_id=$2
    `,
    [req.params.id, req.user.center_id]
  );

  return { success: true };
};