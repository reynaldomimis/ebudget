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

async function audit() {
    try {
        console.log("=== DATA EXISTENCE AUDIT ===");

        const [plans] = await pool.execute("SELECT * FROM plan_info");
        console.log("Plans found:", plans.length);
        console.table(plans);

        const [mooeCount] = await pool.execute("SELECT COUNT(*) as c FROM mooe");
        const [psCount] = await pool.execute("SELECT COUNT(*) as c FROM ps");
        const [obCount] = await pool.execute("SELECT COUNT(*) as c FROM obligation");
        const [prCount] = await pool.execute("SELECT COUNT(*) as c FROM pr_so");

        console.log(`\nGlobal Counts:`);
        console.log(`  MOOE:       ${mooeCount[0].c}`);
        console.log(`  PS:         ${psCount[0].c}`);
        console.log(`  OBLIGATION: ${obCount[0].c}`);
        console.log(`  PR:         ${prCount[0].c}`);

        if (psCount[0].c === 0) {
            console.log("\nWARNING: PS table is empty globally.");
        } else {
            console.log("\nPS Data Sample (First 5):");
            const [psRows] = await pool.execute("SELECT * FROM ps LIMIT 5");
            console.table(psRows);
        }

        // Check if there are other tables or schemas? No, stick to current DB.
        const [tables] = await pool.execute("SHOW TABLES");
        const tableList = tables.map(t => Object.values(t)[0]);
        console.log("\nTables in current DB:", tableList);

        // Search for RLIP in PS table specifically
        if (tableList.includes('ps')) {
            const [rlipCount] = await pool.execute("SELECT COUNT(*) as c FROM ps WHERE expense_items LIKE '%RLIP%'");
            console.log(`RLIP Records in PS: ${rlipCount[0].c}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

audit();
