const cron = require("node-cron");
const pool = require("../config/db");

cron.schedule("0 8 * * *", async () => {
  console.log("[CRON] Fee reminder");

  const { rows } = await pool.query(`
    UPDATE fees
    SET reminder_sent_at = NOW(),
        updated_at = NOW()
    WHERE status IN ('pending','partial')
      AND due_date <= CURRENT_DATE
      AND (reminder_sent_at IS NULL OR date_trunc('day', reminder_sent_at) < CURRENT_DATE)
    RETURNING id, student_id, due_date
  `);

  for (const fee of rows) {
    console.log(`[CRON] Reminder queued for student ${fee.student_id} fee ${fee.id} due ${fee.due_date}`);
  }
});
