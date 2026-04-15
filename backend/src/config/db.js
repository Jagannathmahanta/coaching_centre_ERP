// src/config/db.js
const { Pool } = require("pg");

const { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT } = process.env;

if (!DB_USER || !DB_HOST || !DB_NAME || !DB_PASSWORD || !DB_PORT) {
  throw new Error(
    "Missing required database environment variables. Set DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT.",
  );
}

const dbPort = Number(DB_PORT);
if (Number.isNaN(dbPort) || dbPort <= 0) {
  throw new Error(
    "Invalid DB_PORT environment variable. It must be a positive number.",
  );
}

const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: dbPort,
  // ssl: {
  //   rejectUnauthorized: false,
  // },
});

module.exports = pool;
