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
        console.log("=== PS HIERARCHY INSPECTION ===");
        const [rows] = await pool.execute(`
            SELECT id, pap_type, pap_des, expense_items, amount, cost_category, aggregation_level
            FROM ps
            WHERE is_deleted = 0
            ORDER BY id ASC
        `);

        rows.forEach(r => {
            console.log(`ID: ${r.id} | Type: ${String(r.pap_type).padEnd(40)} | Des: ${String(r.pap_des).padEnd(60)} | Item: ${String(r.expense_items).padEnd(40)} | Cat: ${r.cost_category}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

inspect();
