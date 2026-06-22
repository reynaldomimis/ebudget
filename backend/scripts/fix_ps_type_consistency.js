const fs = require('fs');
const path = require('path');

// Manually load .env
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
    try {
        console.log("=== FIXING PS PAP_TYPE CONSISTENCY ===");
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'NNCpr0p3rty',
            database: process.env.DB_NAME || 'test2'
        });

        // Fix "General Management and Support" (Should be GAS)
        const [res1] = await pool.execute(`
            UPDATE ps
            SET pap_type = 'GENERAL ADMINISTRATION AND SUPPORT'
            WHERE pap_des = 'General Management and Support'
        `);
        console.log(`Updated ${res1.affectedRows} records for General Management and Support.`);

        // Fix "Administration of Personnel Benefits" (Should be GAS)
        const [res2] = await pool.execute(`
            UPDATE ps
            SET pap_type = 'GENERAL ADMINISTRATION AND SUPPORT'
            WHERE pap_des = 'Administration of Personnel Benefits'
        `);
        console.log(`Updated ${res2.affectedRows} records for Administration of Personnel Benefits.`);

        // Ensure NNMP PAPs are correct
        const [res3] = await pool.execute(`
            UPDATE ps
            SET pap_type = 'NATIONAL NUTRITION MANAGEMENT PROGRAM'
            WHERE pap_des IN (
                'Nutrition policy, standards, plan, program development and coordination',
                'Nutrition policy, standards, plan and program development and coordination',
                'Philippine food and nutrition surveillance',
                'Promotion of good nutrition',
                'Assistance to national, local nutrition and related programs'
            )
        `);
        console.log(`Updated ${res3.affectedRows} records for NNMP categories.`);

        console.log("Consistency fix complete.");

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

fix();
