/**
 * config/db.js
 * Creates a mysql2 connection pool. All queries go through pool.promise().
 * The pool is created once and shared across the application.
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               parseInt(process.env.DB_PORT || '3306', 10),
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  // Return JS Date objects for DATE/DATETIME columns
  dateStrings:        false,
});

/**
 * Verifies the DB connection at startup. Called from server.js.
 */
async function connectDB() {
  const conn = await pool.getConnection();
  console.log(`[DB] Connected to MySQL at ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
  conn.release();
}

module.exports = { pool, connectDB };
