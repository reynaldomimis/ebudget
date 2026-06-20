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

const FiscalYearRepository = require('../repositories/FiscalYearRepository');

async function list() {
    try {
        const plans = await FiscalYearRepository.getAll();
        console.log(JSON.stringify(plans, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

list();
