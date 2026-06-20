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

const DashboardService = require('../services/DashboardService');
const FiscalYearContext = require('../engines/FiscalYearContext');

async function trace() {
    try {
        console.log('--- TEST: YEAR STRING 2026 ---');
        const data2026 = await DashboardService.getExecutiveSummary('2026');
        console.log('TRACE: 2026 Data =', JSON.stringify({
            totalBudget: data2026.totalBudget,
            totalObligated: data2026.totalObligated
        }, null, 2));

        console.log('\n--- TEST: INVALID YEAR 2024 ---');
        const data2024 = await DashboardService.getExecutiveSummary('2024');
        console.log('TRACE: 2024 Data (Should fallback to latest/active) =', JSON.stringify({
            totalBudget: data2024.totalBudget,
            totalObligated: data2024.totalObligated
        }, null, 2));

    } catch (e) {
        console.error('TRACE ERROR:', e);
    } finally {
        process.exit();
    }
}

trace();
