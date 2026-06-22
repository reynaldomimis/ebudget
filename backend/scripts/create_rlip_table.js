const fs = require('fs');
const path = require('path');

// Manually load .env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    env.split('\n').forEach(line => {
        const [k, v] = line.split('=');
        if (k && v) process.env[k.trim()] = v.trim();
    });
}

const mysql = require('mysql2/promise');

async function createTable() {
    try {
        console.log("Creating 'rlip' table...");

        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'NNCpr0p3rty',
            database: process.env.DB_NAME || 'test2'
        });

        const sql = `
            CREATE TABLE IF NOT EXISTS rlip (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ps_id INT NOT NULL,
                plan_id VARCHAR(30) NOT NULL,
                plan_year INT NOT NULL,
                pap_des_code VARCHAR(30),
                pap_des TEXT,
                amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_deleted TINYINT(1) DEFAULT 0,
                CONSTRAINT fk_rlip_ps FOREIGN KEY (ps_id) REFERENCES ps(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `;

        await pool.execute(sql);
        console.log("Table 'rlip' created successfully with ON DELETE CASCADE constraint.");

    } catch (e) {
        console.error("Error creating table:", e.message);
    } finally {
        process.exit();
    }
}

createTable();
