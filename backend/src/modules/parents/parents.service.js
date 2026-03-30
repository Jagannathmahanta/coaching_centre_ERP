const pool = require("../../config/db");

exports.getParents = async (req) => {
  const { rows } = await pool.query(
    `
    SELECT 
      p.*,
      u.id AS user_id,
      u.email AS login_email,
      u.phone AS login_phone,
      CASE WHEN u.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_login_account,

      COALESCE(
        json_agg(
          json_build_object(
            'id', s.id,
            'name', s.name,
            'class', s.class,
            'roll_number', s.roll_number
          )
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'
      ) AS children

    FROM parents p
    LEFT JOIN users u
      ON u.parent_id = p.id
     AND u.center_id = p.center_id
    LEFT JOIN students s ON s.parent_id = p.id
    WHERE p.center_id = $1
    GROUP BY p.id, u.id
    ORDER BY p.name
    `,
    [req.user.center_id]
  );

  return rows;
};
