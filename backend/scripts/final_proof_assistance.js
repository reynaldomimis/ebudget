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

const FinancialEngine = require('../engines/FinancialEngine');

async function proof() {
    try {
        const summary = await FinancialEngine.getExecutiveSummary();
        const assistance = summary.papComposition["Assistance to national, local nutrition and related programs"];

        console.log("=== FINAL PROOF: ASSISTANCE PAP ===");
        console.log(JSON.stringify(assistance, null, 2));

        console.log("\nReconciliation Verification:");
        console.log(`PS:   ${assistance.ps} (Expected: 43,291)`);
        console.log(`RLIP: ${assistance.rlip} (Expected: 3,968)`);
        console.log(`GT:   ${assistance.total} (Expected PS+RLIP+MOOE: 43291 + 3968 + 138263001.39 = 138,310,260.39)`);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

proof();
