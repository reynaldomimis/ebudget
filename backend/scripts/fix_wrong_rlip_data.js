const path = require('path');
const { pool } = require('../config/database');

const PAP_TYPE_MAPPING = {
    "GENERAL ADMINISTRATION AND SUPPORT": "1000000000000000",
    "NATIONAL NUTRITION MANAGEMENT PROGRAM": "3101000000000000"
};

const PAP_DES_MAPPING = {
    "General Management and Supervision": "100000100001000",
    "General Management and Support": "100000100001000",
    "Human Resource Development": "100000100002000",
    "Administration of Personnel Benefits": "100000100003000",
    "Nutrition policy, standards, plan and program development and coordination": "310100100001000",
    "Nutrition policy, standards, plans and program development and coordination": "310100100001000",
    "Nutrition policy, standards, plan, program development and coordination": "310100100001000",
    "Philippine food and nutrition surveillance": "310100100002000",
    "Promotion of good nutrition": "310100100003000",
    "Promotion of good nutriiton": "310100100003000",
    "Assistance to national, local nutrition and related programs": "310100100004000"
};

const DES_TO_TYPE = {
    "General Management and Supervision": "GENERAL ADMINISTRATION AND SUPPORT",
    "General Management and Support": "GENERAL ADMINISTRATION AND SUPPORT",
    "Human Resource Development": "GENERAL ADMINISTRATION AND SUPPORT",
    "Administration of Personnel Benefits": "GENERAL ADMINISTRATION AND SUPPORT",
    "Nutrition policy, standards, plan and program development and coordination": "NATIONAL NUTRITION MANAGEMENT PROGRAM",
    "Nutrition policy, standards, plans and program development and coordination": "NATIONAL NUTRITION MANAGEMENT PROGRAM",
    "Nutrition policy, standards, plan, program development and coordination": "NATIONAL NUTRITION MANAGEMENT PROGRAM",
    "Philippine food and nutrition surveillance": "NATIONAL NUTRITION MANAGEMENT PROGRAM",
    "Promotion of good nutrition": "NATIONAL NUTRITION MANAGEMENT PROGRAM",
    "Promotion of good nutriiton": "NATIONAL NUTRITION MANAGEMENT PROGRAM",
    "Assistance to national, local nutrition and related programs": "NATIONAL NUTRITION MANAGEMENT PROGRAM"
};

async function run() {
    try {
        console.log("Identifying wrong RLIP rows for plan 'PLAN-PS-2026-1781880701299'...");
        const [rows] = await pool.execute(`
            SELECT id, pap_type, pap_type_code, pap_des, pap_des_code
            FROM ps
            WHERE cost_category = 'RLIP'
            AND plan_id = 'PLAN-PS-2026-1781880701299'
        `);

        console.log(`Found ${rows.length} RLIP records.`);

        let fixedCount = 0;

        for (const row of rows) {
            const des = row.pap_des;
            const correctType = DES_TO_TYPE[des];
            const correctTypeCode = PAP_TYPE_MAPPING[correctType];
            const correctDesCode = PAP_DES_MAPPING[des];

            if (correctTypeCode && (row.pap_type_code !== correctTypeCode || row.pap_type !== correctType)) {
                console.log(`Fixing ID ${row.id}: Changing type from '${row.pap_type}' to '${correctType}'`);
                await pool.execute(
                    "UPDATE ps SET pap_type = ?, pap_type_code = ?, pap_des_code = ? WHERE id = ?",
                    [correctType, correctTypeCode, correctDesCode, row.id]
                );
                fixedCount++;
            }
        }

        console.log(`\nFixed ${fixedCount} records.`);

        // Also final check
        const [finalRows] = await pool.execute(`
            SELECT id, pap_type, pap_type_code, pap_des, pap_des_code
            FROM ps
            WHERE cost_category = 'RLIP'
            AND plan_id = 'PLAN-PS-2026-1781880701299'
        `);
        console.log("\nFinal state of RLIP records:");
        console.table(finalRows);

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        process.exit();
    }
}

run();
