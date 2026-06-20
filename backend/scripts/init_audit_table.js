const { pool } = require("../config/database");

async function init() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        user_id INT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("SUCCESS: audit_logs table created.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

init();
