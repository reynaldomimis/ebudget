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

async function seed() {
    try {
        const plan_id = 'PLAN-2026-1781778532173';
        const year = 2026;

        const psItems = [
            {
                pap_type: 'NATIONAL NUTRITION MANAGEMENT PROGRAM',
                pap_des: 'Assistance to national, local nutrition and related programs',
                expense_items: 'Salaries and Wages',
                amount: 43291
            },
            {
                pap_type: 'NATIONAL NUTRITION MANAGEMENT PROGRAM',
                pap_des: 'Assistance to national, local nutrition and related programs',
                expense_items: 'RLIP - GSIS',
                amount: 3968
            },
            {
                pap_type: 'GENERAL ADMINISTRATION AND SUPPORT',
                pap_des: 'General Management and Supervision',
                expense_items: 'Salaries and Wages',
                amount: 36646
            }
        ];

        console.log(`Seeding ${psItems.length} PS records for plan ${plan_id}...`);

        for (const item of psItems) {
            await pool.execute(`
                INSERT INTO ps (plan_id, plan_year, pap_type, pap_des, expense_items, amount, total, is_deleted)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            `, [plan_id, year, item.pap_type, item.pap_des, item.expense_items, item.amount, item.amount]);
        }

        console.log("Seeding complete.");

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

seed();
