const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function migrate() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS pr_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pr_id INT NOT NULL,
        description TEXT NOT NULL,
        quantity DECIMAL(15,2),
        unit VARCHAR(50),
        unit_cost DECIMAL(15,2),
        total DECIMAL(15,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_pr_items_pr_id FOREIGN KEY (pr_id) REFERENCES pr_so(id) ON DELETE CASCADE
      )
    `;
    await pool.execute(createTableQuery);
    console.log("SUCCESS: pr_items table created or already exists.");
  } catch (err) {
    console.error("ERROR during migration:", err);
  } finally {
    process.exit();
  }
}

migrate();
