const fs = require('fs');
const path = require('path');

// Basic .env loader
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
        const planId = await FiscalYearContext.getActivePlanId();
        console.log('TRACE: planId =', planId);

        const data = await DashboardService.getExecutiveSummary(planId);
        console.log('TRACE: DashboardService Result =', JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('TRACE ERROR:', e);
    } finally {
        process.exit();
    }
}

trace();
