require("dotenv").config();

const requiredEnv = [
  "JWT_SECRET",
  "DB_USER",
  "DB_HOST",
  "DB_NAME",
  "DB_PASSWORD",
  "DB_PORT",
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missing.join(", ")}`,
  );
  process.exit(1);
}

const app = require("./src/app");
require("./src/jobs/feeReminder.job");
require("./src/jobs/monthlyFee.job");
require("./src/jobs/weeklyReport.job");

const PORT = Number(process.env.PORT || 5000);
if (Number.isNaN(PORT) || PORT <= 0) {
  console.error(
    "❌ Invalid PORT environment variable. It must be a positive number.",
  );
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
