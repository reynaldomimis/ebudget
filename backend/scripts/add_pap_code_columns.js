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
        console.log("Adding PAP code columns to database...");

        // MOOE table
        const [mooeCols] = await pool.execute("SHOW COLUMNS FROM mooe");
        const mooeColNames = mooeCols.map(c => c.Field);

        if (!mooeColNames.includes('pap_type_code')) {
            await pool.execute('ALTER TABLE mooe ADD COLUMN pap_type_code VARCHAR(30) AFTER pap_type');
            console.log("Added pap_type_code to mooe table");
        }

        // pap_des_code already exists in mooe but let's ensure it's varchar(30) or similar
        // Actually instructions say Add: pap_des_code VARCHAR(30)
        // Since it exists, I will just continue.

        // PS table
        const [psCols] = await pool.execute("SHOW COLUMNS FROM ps");
        const psColNames = psCols.map(c => c.Field);

        if (!psColNames.includes('pap_type_code')) {
            await pool.execute('ALTER TABLE ps ADD COLUMN pap_type_code VARCHAR(30) AFTER pap_type');
            console.log("Added pap_type_code to ps table");
        }

        console.log("Database schema preparation complete.");
    } catch (e) {
        console.error(e.message);
    } finally {
        process.exit();
    }
}

run();
