const jwt = require("jsonwebtoken");
const pool = require("../config/db");

module.exports = async (req, res, next) => {
  const authorization = req.headers && req.headers.authorization;
  const token = authorization ? authorization.split(" ")[1] : null;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);

    if (req.user.role === "super_admin" && !req.user.center_id) {
      return next();
    }

    if (!req.user.center_id) {
      return res.status(403).json({ error: "This account is not linked to an active institute." });
    }

    const centerResult = await pool.query(
      `
      SELECT id, status
      FROM coaching_centers
      WHERE id = $1
      LIMIT 1
      `,
      [req.user.center_id]
    );

    const center = centerResult.rows[0];
    if (!center) {
      return res.status(404).json({ error: "Institute not found." });
    }
    if (center.status !== "active") {
      return res.status(403).json({ error: "This institute is currently inactive." });
    }

    if (req.user.role === "student") {
      const result = await pool.query(
        `
        SELECT status
        FROM students
        WHERE id = $1 AND center_id = $2
        LIMIT 1
        `,
        [req.user.student_id, req.user.center_id]
      );

      if (!result.rows[0] || result.rows[0].status !== "active") {
        return res.status(403).json({ error: "This student account is inactive." });
      }
    }

    if (req.user.role === "teacher") {
      const result = await pool.query(
        `
        SELECT status
        FROM teachers
        WHERE id = $1 AND center_id = $2
        LIMIT 1
        `,
        [req.user.teacher_id, req.user.center_id]
      );

      if (!result.rows[0] || result.rows[0].status !== "active") {
        return res.status(403).json({ error: "This teacher account is inactive." });
      }
    }

    if (req.user.role === "parent") {
      const result = await pool.query(
        `
        SELECT 1
        FROM students
        WHERE parent_id = $1
          AND center_id = $2
          AND status = 'active'
        LIMIT 1
        `,
        [req.user.parent_id, req.user.center_id]
      );

      if (!result.rows[0]) {
        return res.status(403).json({ error: "This parent account is inactive because no linked student is active." });
      }
    }

    next();
  } catch (error) {
    res.status(error.statusCode || 401).json({ error: error.statusCode ? error.message : "Invalid token" });
  }
};
