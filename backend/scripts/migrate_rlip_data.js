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

async function migrate() {
    try {
        console.log("=== RLIP DATA MIGRATION ===");

        // 1. Identify records that need fixing
        const [rows] = await pool.execute(`
            SELECT * FROM ps
            WHERE pap_des LIKE '%Retirement and Life Insurance Premiums%'
               OR pap_des LIKE '%(RLIP)%'
        `);

        console.log(`Found ${rows.length} records to migrate.`);

        for (const row of rows) {
            console.log(`Processing ID ${row.id}: ${row.expense_items}`);

            const actualPapDes = row.expense_items;
            const costCategory = 'RLIP';

            // Try to resolve pap_type and pap_des_code from MOOE or other PS records
            const [mooeMatch] = await pool.execute(
                "SELECT pap_type, pap_des_code FROM mooe WHERE pap_des = ? AND plan_id = ? LIMIT 1",
                [actualPapDes, row.plan_id]
            );

            let papType = row.pap_type;
            let papCode = row.pap_des_code;

            if (mooeMatch.length > 0) {
                papType = mooeMatch[0].pap_type;
                papCode = mooeMatch[0].pap_des_code;
                console.log(`  Inherited from MOOE: Type="${papType}", Code="${papCode}"`);
            } else {
                const [psMatch] = await pool.execute(
                    "SELECT pap_type, pap_des_code FROM ps WHERE pap_des = ? AND plan_id = ? AND id != ? LIMIT 1",
                    [actualPapDes, row.plan_id, row.id]
                );
                if (psMatch.length > 0) {
                    papType = psMatch[0].pap_type;
                    papCode = psMatch[0].pap_des_code;
                    console.log(`  Inherited from PS: Type="${papType}", Code="${papCode}"`);
                }
            }

            await pool.execute(`
                UPDATE ps
                SET pap_des = ?,
                    pap_type = ?,
                    pap_des_code = ?,
                    cost_category = ?,
                    expense_items = 'RLIP'
                WHERE id = ?
            `, [actualPapDes, papType, papCode, costCategory, row.id]);
        }

        console.log("Migration complete.");

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

migrate();
