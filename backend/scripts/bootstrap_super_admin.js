const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return "";
  return String(process.argv[index + 1] || "").trim();
}

function printUsage() {
  console.log(
    "usage: node backend/scripts/bootstrap_super_admin.js --name \"Platform Owner\" --email owner@example.com --password \"StrongPass123\" [--phone 9999999999]"
  );
}

async function main() {
  const name = getArgValue("--name");
  const email = getArgValue("--email").toLowerCase();
  const password = getArgValue("--password");
  const phone = getArgValue("--phone") || null;

  if (!name || !email || !password) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `
      SELECT id, name, email, phone
      FROM users
      WHERE role = 'super_admin'
        AND (
          ($1::text IS NOT NULL AND LOWER(email) = $1)
          OR ($2::text IS NOT NULL AND phone = $2)
        )
      LIMIT 1
      `,
      [email || null, phone]
    );

    if (existing.rows[0]) {
      throw new Error("A super_admin user already exists with this email or phone.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const inserted = await client.query(
      `
      INSERT INTO users (name, email, phone, password_hash, role, center_id, is_staff)
      VALUES ($1, $2, $3, $4, 'super_admin', NULL, FALSE)
      RETURNING id, name, email, phone, role, center_id, created_at
      `,
      [name, email, phone, passwordHash]
    );

    await client.query("COMMIT");

    console.log("super_admin_created");
    console.log(JSON.stringify(inserted.rows[0], null, 2));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
