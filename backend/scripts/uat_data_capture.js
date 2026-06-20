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

async function capture() {
    try {
        const data = await DashboardService.getExecutiveSummary();
        const [auditLogs] = await require('../config/database').pool.execute('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 5');

        console.log('---BEGIN_UAT_DATA---');
        console.log(JSON.stringify({
            dashboard: data,
            audit: auditLogs
        }, null, 2));
        console.log('---END_UAT_DATA---');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

capture();
