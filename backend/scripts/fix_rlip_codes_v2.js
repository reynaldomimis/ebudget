const fs = require('fs');
const path = require('path');

// Load environment variables from .env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    env.split('\n').forEach(line => {
        const [k, v] = line.split('=');
        if (k && v) process.env[k.trim()] = v.trim();
    });
}

const mysql = require('mysql2/promise');

async function fix() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'test2'
    };

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Database connected for fixing RLIP data...");

        const plan_id = 'PLAN-PS-2026-1781880701299';

        // 1. Fix "General Management and Support" (Switch to GAS)
        const [res1] = await connection.execute(`
            UPDATE ps
            SET pap_type = 'GENERAL ADMINISTRATION AND SUPPORT',
                pap_type_code = '1000000000000000',
                pap_des_code = '100000100001000'
            WHERE cost_category = 'RLIP'
            AND pap_des = 'General Management and Support'
            AND plan_id = ?`, [plan_id]);
        console.log(`Updated GAS records: ${res1.affectedRows}`);

        // 2. Fix NNMP Codes
        const nnmpFixes = [
            { des: 'Nutrition policy%', code: '310100100001000' },
            { des: 'Philippine food and nutrition surveillance', code: '310100100002000' },
            { des: 'Promotion of good nutrition', code: '310100100003000' },
            { des: 'Assistance to national, local nutrition and related programs', code: '310100100004000' }
        ];

        for (const f of nnmpFixes) {
            const [res] = await connection.execute(`
                UPDATE ps
                SET pap_des_code = ?
                WHERE cost_category = 'RLIP'
                AND pap_des LIKE ?
                AND plan_id = ?`, [f.code, f.des, plan_id]);
            console.log(`Updated code for ${f.des}: ${res.affectedRows}`);
        }

        console.log("Data correction complete.");
    } catch (err) {
        console.error("Error during data fix:", err.message);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

fix();
