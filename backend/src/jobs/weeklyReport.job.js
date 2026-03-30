const cron = require("node-cron");
const pool = require("../config/db");

cron.schedule("0 9 * * 0", async () => {
  console.log("[CRON] Generating weekly reports...");

  try {
    const { rows: centers } = await pool.query(
      "SELECT * FROM coaching_centers WHERE status='active'"
    );

    for (const center of centers) {
      const cid = center.id;

      const [students, fees, hostel, transport] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) as total FROM students WHERE center_id=$1`,
          [cid]
        ),

        pool.query(
          `
          SELECT 
            COALESCE(SUM(paid_amount),0) as collected,
            COALESCE(SUM(balance),0) as pending
          FROM fees
          WHERE center_id=$1
          `,
          [cid]
        ),

        pool.query(
          `
          SELECT COUNT(*) as residents 
          FROM student_allocations 
          WHERE type='hostel' AND center_id=$1
          `,
          [cid]
        ),

        pool.query(
          `
          SELECT COUNT(*) as transport_students 
          FROM student_allocations 
          WHERE type='transport' AND center_id=$1
          `,
          [cid]
        ),
      ]);

      const report = {
        center: center.name,
        total_students: students.rows[0].total,
        collected: fees.rows[0].collected,
        pending: fees.rows[0].pending,
        hostel: hostel.rows[0].residents,
        transport: transport.rows[0].transport_students,
      };

      // 👉 Replace this with email / WhatsApp / SMS later
      console.log("[WEEKLY REPORT]", report);
    }

    console.log("[CRON] Weekly reports generated");

  } catch (e) {
    console.error("[CRON] Weekly Report Error:", e.message);
  }
});