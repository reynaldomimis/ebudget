const path = require('path');
console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Dotenv path:', path.join(__dirname, '../.env'));
try {
    require('dotenv');
    console.log('Dotenv found');
} catch (e) {
    console.log('Dotenv NOT found');
}
