const path = require('path');
console.log('Current directory:', __dirname);
console.log('Files in current directory:');
const fs = require('fs');
fs.readdirSync(__dirname).forEach(file => {
  console.log(' -', file);
});