const cron = require("node-cron");
const pool = require("../config/db");

cron.schedule("0 7 1 * *", async () => {
  console.log("[CRON] Fee plan audit started...");

  try {
    const { rows } = await pool.query(
      `
      SELECT COUNT(*) AS due_this_month
      FROM fees
      WHERE status IN ('pending', 'partial')
        AND date_trunc('month', due_date) = date_trunc('month', CURRENT_DATE)
      `
    );

    const overdueResult = await pool.query(
      `
      SELECT COUNT(*) AS overdue_count
      FROM fees
      WHERE status IN ('pending', 'partial')
        AND due_date < date_trunc('month', CURRENT_DATE)
      `
    );

    console.log(`[CRON] Pending installments due this month: ${rows[0].due_this_month}`);
    console.log(`[CRON] Overdue installments carried forward: ${overdueResult.rows[0].overdue_count}`);
  } catch (error) {
    console.error("[CRON] Fee plan audit error:", error.message);
  }
});
