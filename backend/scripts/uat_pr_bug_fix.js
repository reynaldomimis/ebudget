const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { pool } = require("../config/database");
const PRService = require("../services/prService");

async function runUAT() {
    console.log("--- STARTING PR BUG FIX UAT ---");
    const mooeId = 4496;

    try {
        console.log("\n[Step 1] Creating Purchase Request with 2 items...");
        const prno = `PR-UAT-FIX-${Date.now()}`;
        const prData = {
            prno: prno,
            mooe_id: mooeId,
            transaction_date: new Date().toISOString().split('T')[0],
            purpose: "UAT Verification for Items Persistence and Purpose Bug",
            amount: 15000,
            items: [
                {
                    description: "Monitor 24 inch",
                    quantity: 2,
                    unit: "pcs",
                    unit_cost: 5000,
                    total: 10000
                },
                {
                    description: "Wireless Keyboard",
                    quantity: 5,
                    unit: "pcs",
                    unit_cost: 1000,
                    total: 5000
                }
            ]
        };

        const result = await PRService.createPR(prData);
        const prId = result.insertId;
        console.log(`PR Header created with ID: ${prId}`);

        // Verification 1: Header Persistence & Purpose
        console.log("\n[Step 2] Verifying PR Header and Purpose...");
        const [headerRows] = await pool.execute("SELECT * FROM pr_so WHERE id = ?", [prId]);
        const header = headerRows[0];
        console.log("Database Row:", header);

        if (header.purpose === prData.purpose) {
            console.log("SUCCESS: Purpose correctly saved.");
        } else {
            console.log(`FAILURE: Purpose mismatch. Expected: "${prData.purpose}", Got: "${header.purpose}"`);
        }

        // Verification 2: Items Persistence
        console.log("\n[Step 3] Verifying PR Items...");
        const [itemRows] = await pool.execute("SELECT * FROM pr_items WHERE pr_id = ?", [prId]);
        console.log(`Found ${itemRows.length} items in database.`);
        console.table(itemRows);

        if (itemRows.length === 2) {
            console.log("SUCCESS: 2 items correctly saved.");
        } else {
            console.log(`FAILURE: Item count mismatch. Expected: 2, Got: ${itemRows.length}`);
        }

        // Verification 3: Math Consistency
        const dbItemsSum = itemRows.reduce((sum, item) => sum + Number(item.total), 0);
        console.log(`Sum of items total in DB: ${dbItemsSum}`);
        if (dbItemsSum === Number(header.amount)) {
            console.log("SUCCESS: Database header amount matches sum of items.");
        } else {
            console.log(`FAILURE: Amount mismatch. Header: ${header.amount}, Items Sum: ${dbItemsSum}`);
        }

        console.log("\n--- UAT COMPLETED SUCCESSFULLY ---");
        process.exit(0);
    } catch (error) {
        console.error("UAT FAILED:", error);
        process.exit(1);
    }
}

runUAT();
