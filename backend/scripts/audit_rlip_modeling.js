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

async function audit() {
    try {
        console.log("=== RLIP MODELING AUDIT ===");

        // 1. Check for "fake" PAP descriptions
        const [rlipRows] = await pool.execute(`
            SELECT id, pap_des, expense_items, amount, cost_category
            FROM ps
            WHERE pap_des LIKE '%RLIP%'
        `);

        console.log(`Found ${rlipRows.length} rows with RLIP in pap_des.`);
        if (rlipRows.length > 0) {
            console.log("Sample Data:");
            console.table(rlipRows);
        }

        // 2. Check for records that SHOULD be RLIP but aren't tagged
        const [untagged] = await pool.execute(`
            SELECT id, pap_des, expense_items, amount, cost_category
            FROM ps
            WHERE expense_items LIKE '%RLIP%' AND cost_category != 'RLIP'
        `);
        console.log(`Found ${untagged.length} untagged RLIP records.`);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

audit();
