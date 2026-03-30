const pool = require("../../config/db");

exports.getRoutes = async (req) => {
  const { rows } = await pool.query(
    `
    SELECT r.*, 
      COUNT(sa.id) as student_count
    FROM transport_routes r
    LEFT JOIN student_allocations sa 
      ON sa.route_id = r.id AND sa.type='transport'
    WHERE r.center_id=$1
    GROUP BY r.id
    ORDER BY r.route_name
    `,
    [req.user.center_id]
  );

  return rows;
};

exports.createRoute = async (req) => {
  const {
    route_name,
    vehicle_number,
    driver_name,
    driver_phone,
    monthly_fee,
    capacity,
  } = req.body;

  const { rows } = await pool.query(
    `
    INSERT INTO transport_routes 
    (route_name, vehicle_number, driver_name, driver_phone, monthly_fee, capacity, center_id, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,'active')
    RETURNING *
    `,
    [
      route_name,
      vehicle_number,
      driver_name,
      driver_phone,
      monthly_fee,
      capacity,
      req.user.center_id,
    ]
  );

  return rows[0];
};

exports.assignStudent = async (req) => {
  const { student_id, route_id } = req.body;

  const { rows } = await pool.query(
    `
    INSERT INTO student_allocations (student_id, route_id, type, center_id)
    VALUES ($1,$2,'transport',$3)
    ON CONFLICT DO NOTHING
    RETURNING *
    `,
    [student_id, route_id, req.user.center_id]
  );

  return rows[0] || { message: "Already assigned" };
};