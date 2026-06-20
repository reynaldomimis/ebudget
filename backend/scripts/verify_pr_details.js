const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const PRService = require("../services/prService");

async function verify() {
    console.log("=== VERIFYING PR VIEW DETAILS (HEADER + ITEMS) ===");
    try {
        // Fetch the last created PR from our previous UAT
        const prs = await PRService.getAllPRs();
        if (prs.length === 0) {
            console.log("No PRs found to verify.");
            return;
        }

        const targetId = prs[0].id;
        console.log(`Fetching details for PR ID: ${targetId} (${prs[0].prno})...`);

        const details = await PRService.getPRById(targetId);

        console.log("\n--- HEADER ---");
        console.log(`PR No: ${details.prno}`);
        console.log(`Date: ${details.transaction_date}`);
        console.log(`Purpose: ${details.purpose}`);
        console.log(`Header Amount: ${details.pr_amount}`);

        console.log("\n--- ITEMS ---");
        if (details.items && details.items.length > 0) {
            console.table(details.items.map(i => ({
                Desc: i.description,
                Qty: i.quantity,
                Unit: i.unit,
                Cost: i.unit_cost,
                Total: i.total
            })));
        } else {
            console.log("No items found for this PR.");
        }

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        process.exit();
    }
}

verify();
