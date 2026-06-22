const mysql = require('../node_modules/mysql2/promise');
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

async function fix() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'test2'
        });

        const plan_id = 'PLAN-PS-2026-1781880701299';

        await pool.execute(`
            UPDATE ps
            SET pap_type = 'GENERAL ADMINISTRATION AND SUPPORT',
                pap_type_code = '1000000000000000',
                pap_des_code = '100000100001000'
            WHERE cost_category = 'RLIP'
            AND pap_des = 'General Management and Support'
            AND plan_id = ?`, [plan_id]);

        const nnmpFixes = [
            { des: 'Nutrition policy, standards, plan and program development and coordination', code: '310100100001000' },
            { des: 'Philippine food and nutrition surveillance', code: '310100100002000' },
            { des: 'Promotion of good nutrition', code: '310100100003000' },
            { des: 'Assistance to national, local nutrition and related programs', code: '310100100004000' }
        ];

        for (const f of nnmpFixes) {
            await pool.execute(`
                UPDATE ps
                SET pap_des_code = ?
                WHERE cost_category = 'RLIP'
                AND pap_des = ?
                AND plan_id = ?`, [f.code, f.des, plan_id]);
        }

        console.log("SUCCESS: Data correction complete.");
    } catch (err) {
        console.error("FAILED:", err.message);
    } finally {
        process.exit();
    }
}

fix();
