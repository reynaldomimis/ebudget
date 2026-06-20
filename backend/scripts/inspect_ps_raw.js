const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    env.split('\n').forEach(line => {
        const [k, v] = line.split('=');
        if (k && v) process.env[k.trim()] = v.trim();
    });
}

const { pool } = require('../config/database');

async function inspect() {
    try {
        console.log("=== RAW PS TABLE INSPECTION ===");
        const [allRows] = await pool.execute("SELECT * FROM ps");
        console.log(`Total rows in PS table: ${allRows.length}`);

        if (allRows.length > 0) {
            console.log("First 5 rows:");
            console.table(allRows.slice(0, 5));

            const [activeRows] = await pool.execute("SELECT * FROM ps WHERE is_deleted = 0");
            console.log(`Total active (is_deleted=0) rows: ${activeRows.length}`);
        } else {
            console.log("PS table is EMPTY.");
        }

        const [distinctPlans] = await pool.execute("SELECT DISTINCT plan_id FROM ps");
        console.log("Distinct Plan IDs in PS:", distinctPlans.map(r => r.plan_id));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

inspect();
