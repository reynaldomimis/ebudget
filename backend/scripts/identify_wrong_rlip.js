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
        console.log("Identifying wrong RLIP rows for plan 'PLAN-PS-2026-1781880701299'...");
        const [rows] = await pool.execute(`
            SELECT id, pap_type, pap_type_code, pap_des, pap_des_code
            FROM ps
            WHERE cost_category = 'RLIP'
            AND plan_id = 'PLAN-PS-2026-1781880701299'
        `);

        console.log(`Found ${rows.length} RLIP records:`);
        console.table(rows);

        // Analyze which ones are wrong based on the rules
        const rules = {
            "General Management and Support": { typeCode: "1000000000000000" },
            "Nutrition policy, standards, plan and program development and coordination": { typeCode: "3101000000000000" },
            "Philippine food and nutrition surveillance": { typeCode: "3101000000000000" },
            "Promotion of good nutrition": { typeCode: "3101000000000000" },
            "Assistance to national, local nutrition and related programs": { typeCode: "3101000000000000" }
        };

        const wrongRows = rows.filter(r => {
            const rule = rules[r.pap_des];
            return rule && r.pap_type_code !== rule.typeCode;
        });

        console.log(`\nDetected ${wrongRows.length} rows with wrong pap_type_code.`);
        if (wrongRows.length > 0) {
            console.log("Rows to be fixed:");
            console.table(wrongRows);
        }

    } catch (e) {
        console.error(e.message);
    } finally {
        process.exit();
    }
}

run();
