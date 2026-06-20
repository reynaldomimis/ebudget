const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");

async function rca() {
    console.log('--- 1 & 2: Exact ID Check (Historical) ---');
    console.log('Orphan ID: 75, Referenced PS_ID: 481');

    console.log('\n--- 3: Relationship Verification (Checking for orphans) ---');
    const queries = {
        'Obligation -> PS': 'SELECT o.id, o.ps_id FROM obligation o LEFT JOIN ps p ON o.ps_id = p.id WHERE o.ps_id IS NOT NULL AND p.id IS NULL',
        'Obligation -> MOOE': 'SELECT o.id, o.mooe_id FROM obligation o LEFT JOIN mooe m ON o.mooe_id = m.id WHERE o.mooe_id IS NOT NULL AND m.id IS NULL',
        'Obligation -> PR': 'SELECT o.id, o.pr_id FROM obligation o LEFT JOIN pr_so p ON o.pr_id = p.id WHERE o.pr_id IS NOT NULL AND p.id IS NULL',
        'PR -> MOOE': 'SELECT p.id, p.mooe_id FROM pr_so p LEFT JOIN mooe m ON p.mooe_id = m.id WHERE p.mooe_id IS NOT NULL AND m.id IS NULL',
        'PR Items -> PR': 'SELECT i.id, i.pr_id FROM pr_items i LEFT JOIN pr_so p ON i.pr_id = p.id WHERE i.pr_id IS NOT NULL AND p.id IS NULL'
    };

    let totalOrphans = 0;
    for (const [name, sql] of Object.entries(queries)) {
        const [rows] = await pool.execute(sql);
        console.log(`${name} Orphans: ${rows.length}`);
        totalOrphans += rows.length;
        if (rows.length > 0) console.table(rows);
    }

    console.log('\n--- 4: Foreign Key Verification ---');
    const [fks] = await pool.execute(`
        SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.table(fks);

    if (totalOrphans === 0) {
        console.log('\nVERDICT: 0 orphans found system-wide.');
    } else {
        console.log(`\nVERDICT: ${totalOrphans} orphans still present.`);
    }

    process.exit();
}

rca();
