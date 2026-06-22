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

async function run() {
    let connection;
    try {
        console.log("Starting RLIP backfill process...");

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'NNCpr0p3rty',
            database: process.env.DB_NAME || 'test2'
        });

        // 1. Find all RLIP records in ps table
        const [psRlipRows] = await connection.execute("SELECT * FROM ps WHERE cost_category = 'RLIP' AND is_deleted = 0");
        console.log(`Found ${psRlipRows.length} RLIP records in 'ps' table.`);

        let backfilledCount = 0;

        for (const row of psRlipRows) {
            // Check if already exists in rlip table to avoid duplicates
            const [existing] = await connection.execute("SELECT id FROM rlip WHERE ps_id = ?", [row.id]);

            if (existing.length === 0) {
                await connection.execute(
                    `INSERT INTO rlip (ps_id, plan_id, plan_year, pap_des_code, pap_des, amount)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [row.id, row.plan_id, row.plan_year, row.pap_des_code, row.pap_des, row.amount]
                );
                backfilledCount++;
            }
        }

        console.log(`Successfully backfilled ${backfilledCount} records into 'rlip' table.`);

    } catch (e) {
        console.error("Backfill failed:", e.message);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

run();
