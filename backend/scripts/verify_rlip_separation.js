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
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'NNCpr0p3rty',
            database: process.env.DB_NAME || 'test2'
        });

        const [psCount] = await connection.execute("SELECT COUNT(*) as c FROM ps WHERE cost_category = 'RLIP'");
        const [rlipCount] = await connection.execute("SELECT COUNT(*) as c FROM rlip WHERE is_deleted = 0");

        console.log("=== RLIP SEPARATION AUDIT ===");
        console.log(`Records in 'ps' table with cost_category='RLIP': ${psCount[0].c} (Should be 0)`);
        console.log(`Records in 'rlip' table:                       ${rlipCount[0].c}`);

    } catch (e) {
        console.error("Audit failed:", e.message);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

run();
