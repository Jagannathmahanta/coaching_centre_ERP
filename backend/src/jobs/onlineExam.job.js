const cron = require("node-cron");
const pool = require("../config/db");

if (!global.__onlineExamAutoEndJobStarted) {
  cron.schedule("*/10 * * * *", async () => {
    try {
      await pool.query(
        `
        UPDATE online_exams
        SET status = 'ended', updated_at = NOW()
        WHERE status = 'published'
          AND end_time IS NOT NULL
          AND end_time < NOW()
        `
      );
    } catch (error) {
      console.error("[CRON] online-exam auto-end:", error.message);
    }
  });

  global.__onlineExamAutoEndJobStarted = true;
}
