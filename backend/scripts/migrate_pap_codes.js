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

const PAP_TYPE_MAPPING = {
    "GENERAL ADMINISTRATION AND SUPPORT": "1000000000000000",
    "NATIONAL NUTRITION MANAGEMENT PROGRAM": "3101000000000000"
};

const PAP_DES_MAPPING = {
    // GAS
    "General Management and Supervision": "100000100001000",
    "General Management and Support": "100000100001000",
    "Human Resource Development": "100000100002000",
    "Administration of Personnel Benefits": "100000100003000", // New inferred code or common mapping

    // NNMP
    "Nutrition policy, standards, plan and program development and coordination": "310100100001000",
    "Nutrition policy, standards, plans and program development and coordination": "310100100001000",
    "Nutrition policy, standards, plan, program development and coordination": "310100100001000",
    "Philippine food and nutrition surveillance": "310100100002000",
    "Promotion of good nutrition": "310100100003000",
    "Promotion of good nutriiton": "310100100003000",
    "Assistance to national, local nutrition and related programs": "310100100004000"
};

async function migrate() {
    console.log("=== PAP CODE MIGRATION AUDIT ===");

    let mooeUpdated = 0;
    let psUpdated = 0;
    let unmappedTypes = new Set();
    let unmappedDes = new Set();

    try {
        // 1. Process MOOE
        const [mooeRecords] = await pool.execute("SELECT id, pap_type, pap_des FROM mooe WHERE is_deleted = 0");
        for (const row of mooeRecords) {
            const typeKey = (row.pap_type || "").trim().toUpperCase();
            const desKey = (row.pap_des || "").trim();

            const typeCode = PAP_TYPE_MAPPING[typeKey] || null;
            const desCode = PAP_DES_MAPPING[desKey] || null;

            if (!typeCode) unmappedTypes.add(typeKey);
            if (!desCode) unmappedDes.add(desKey);

            if (typeCode || desCode) {
                await pool.execute(
                    "UPDATE mooe SET pap_type_code = ?, pap_des_code = ? WHERE id = ?",
                    [typeCode, desCode, row.id]
                );
                mooeUpdated++;
            }
        }

        // 2. Process PS
        const [psRecords] = await pool.execute("SELECT id, pap_type, pap_des FROM ps WHERE is_deleted = 0");
        for (const row of psRecords) {
            const typeKey = (row.pap_type || "").trim().toUpperCase();
            const desKey = (row.pap_des || "").trim();

            const typeCode = PAP_TYPE_MAPPING[typeKey] || null;
            const desCode = PAP_DES_MAPPING[desKey] || null;

            if (!typeCode) unmappedTypes.add(typeKey);
            if (!desCode) unmappedDes.add(desKey);

            if (typeCode || desCode) {
                await pool.execute(
                    "UPDATE ps SET pap_type_code = ?, pap_des_code = ? WHERE id = ?",
                    [typeCode, desCode, row.id]
                );
                psUpdated++;
            }
        }

        console.log(`Total MOOE records updated: ${mooeUpdated}`);
        console.log(`Total PS records updated:   ${psUpdated}`);
        console.log(`Total PAP Types mapped:     ${Object.keys(PAP_TYPE_MAPPING).length}`);
        console.log(`Total PAP Descriptions mapped: ${Object.keys(PAP_DES_MAPPING).length}`);

        console.log("\nUnmapped PAP Types:");
        [...unmappedTypes].filter(Boolean).forEach(t => console.log(` - ${t}`));

        console.log("\nUnmapped PAP Descriptions:");
        [...unmappedDes].filter(Boolean).forEach(d => console.log(` - ${d}`));

    } catch (e) {
        console.error("Migration failed:", e.message);
    } finally {
        process.exit();
    }
}

migrate();
