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
        console.log("=== RLIP OWNERSHIP VALIDATION AUDIT ===\n");

        // Fetch all PS records ordered by id to see the original import sequence
        const [rows] = await pool.execute(`
            SELECT id, pap_type, pap_des, pap_des_code, expense_items, amount, cost_category, aggregation_level
            FROM ps
            WHERE is_deleted = 0
            ORDER BY id ASC
        `);

        let report = [];
        let stats = {
            total: 0,
            typeOwned: 0,
            desOwned: 0,
            ambiguous: 0,
            unlinked: 0
        };

        rows.forEach((row, index) => {
            const isRLIP = row.cost_category === 'RLIP' ||
                           (row.expense_items && row.expense_items.toUpperCase().includes('RLIP')) ||
                           (row.pap_des && row.pap_des.toUpperCase().includes('RLIP'));

            if (!isRLIP) return;

            stats.total++;

            let ownership = "Unknown";
            let parentType = row.pap_type || "N/A";
            let parentDes = row.pap_des || "N/A";

            // If it's a specific item, check its metadata
            if (row.aggregation_level === 'PAP_TYPE') {
                ownership = "PAP_TYPE";
                stats.typeOwned++;
            } else if (row.aggregation_level === 'PAP_DESCRIPTION' || (row.pap_des && row.pap_des.trim() !== "" && !row.pap_des.includes("RLIP"))) {
                ownership = "PAP_DESCRIPTION";
                stats.desOwned++;
            } else if (row.pap_des && row.pap_des.toUpperCase().includes("RETIREMENT AND LIFE INSURANCE PREMIUMS")) {
                // This is a "fake" description row that usually sits between Type and Des
                // We need to look at context. If the previous major row was a TYPE and next is a DES,
                // and it contains sub-items for DES, it might be DES owned.
                ownership = "Ambiguous";
                stats.ambiguous++;
            } else {
                stats.unlinked++;
            }

            report.push({
                ID: row.id,
                Amount: row.amount,
                Type: parentType,
                Description: parentDes,
                Level: row.aggregation_level,
                Ownership: ownership
            });
        });

        console.log("RLIP OWNERSHIP REPORT:");
        console.table(report);

        console.log("\nOWNERSHIP SUMMARY:");
        console.log(`Total RLIP rows:                ${stats.total}`);
        console.log(`PAP_TYPE-owned RLIP rows:       ${stats.typeOwned}`);
        console.log(`PAP_DESCRIPTION-owned RLIP rows: ${stats.desOwned}`);
        console.log(`Ambiguous RLIP rows:            ${stats.ambiguous}`);
        console.log(`Unlinked RLIP rows:             ${stats.unlinked}`);

        // Special Validation: GAS
        console.log("\n--- SPECIAL VALIDATION: GENERAL ADMINISTRATION AND SUPPORT ---");
        const gasRlip = report.filter(r => r.Type.includes("GENERAL ADMINISTRATION"));
        if (gasRlip.length > 0) {
            gasRlip.forEach(r => {
                console.log(`RLIP ID ${r.ID} attached to: ${r.Description} (Ownership: ${r.Ownership})`);
            });
        } else {
            console.log("No GAS RLIP rows found in current active set.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

audit();
