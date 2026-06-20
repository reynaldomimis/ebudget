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

async function search() {
    try {
        const [rows] = await pool.execute(`
            SELECT pap_des, SUM(totalFq) as mooe_sum
            FROM mooe
            WHERE pap_des LIKE '%Assistance to national%'
            GROUP BY pap_des
        `);
        console.log("Matching MOOE PAPs:");
        console.table(rows);

        const [psRows] = await pool.execute(`
            SELECT * FROM ps
            WHERE pap_des LIKE '%Assistance to national%'
        `);
        console.log("Matching PS PAPs:");
        console.table(psRows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

search();
