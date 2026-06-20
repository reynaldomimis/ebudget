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

async function run() {
    try {
        console.log("Adding cost_category to ps table...");
        await pool.execute('ALTER TABLE ps ADD COLUMN cost_category VARCHAR(50) DEFAULT "PS" AFTER pap_des_code');
        console.log("Success.");
    } catch (e) {
        console.error(e.message);
    } finally {
        process.exit();
    }
}

run();
