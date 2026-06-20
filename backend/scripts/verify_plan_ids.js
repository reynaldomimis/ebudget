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

async function verify() {
    try {
        console.log("=== PLAN ID VERIFICATION ===");
        const [plans] = await pool.execute("SELECT * FROM plan_info");
        console.log("Plan Info Records:");
        console.table(plans);

        const [mooeDistinct] = await pool.execute("SELECT DISTINCT plan_id FROM mooe");
        console.log("\nPlan IDs in MOOE table:", mooeDistinct.map(r => r.plan_id));

        const [psDistinct] = await pool.execute("SELECT DISTINCT plan_id FROM ps");
        console.log("Plan IDs in PS table:", psDistinct.map(r => r.plan_id));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

verify();
