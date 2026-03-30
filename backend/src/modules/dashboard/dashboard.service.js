const pool = require("../../config/db");

exports.getDashboard = async (req) => {
  const cid = req.user.center_id;

  const [
    studentStatsRes,
    feeStatsRes,
    upcomingExamsRes,
    recentResultsRes,
    recentNoticesRes,
    upcomingHolidaysRes,
    pendingFeesRes,
  ] = await Promise.all([
    pool.query(`
      SELECT 
        COUNT(*) as total_students,
        COUNT(*) FILTER (WHERE status='active') as active_students
      FROM students 
      WHERE center_id=$1
    `, [cid]),

    pool.query(`
      SELECT 
        COALESCE(SUM(paid_amount),0) as collected_this_month,
        COALESCE(SUM(balance),0) as pending_this_month,
        COUNT(*) FILTER (WHERE status IN ('pending', 'partial') AND balance > 0) as pending_fee_count
      FROM fees 
      WHERE center_id=$1 
      AND date_trunc('month', due_date) = date_trunc('month', CURRENT_DATE)
    `, [cid]),

    pool.query(`
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
    `, [cid]),

    pool.query(`
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
    `, [cid]),

    pool.query(`
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
    `, [cid]),

    pool.query(`
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
    `, [cid]),

    pool.query(`
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
      ORDER BY f.due_date ASC, f.balance DESC
      LIMIT 8
    `, [cid]),
  ]);

  return {
    stats: {
      ...studentStatsRes.rows[0],
      ...feeStatsRes.rows[0],
      upcoming_exam_count: upcomingExamsRes.rowCount,
      recent_result_count: recentResultsRes.rowCount,
      active_notice_count: recentNoticesRes.rowCount,
      holiday_notice_count: upcomingHolidaysRes.rowCount,
    },
    recent_notices: recentNoticesRes.rows,
    upcoming_exams: upcomingExamsRes.rows,
    recent_results: recentResultsRes.rows,
    upcoming_holidays: upcomingHolidaysRes.rows,
    pending_fees: pendingFeesRes.rows,
  };
};
