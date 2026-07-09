const fs = require('fs');
const path = require('path');

const packages = [
  'backend/alert-service/package.json',
  'backend/gateway/package.json',
  'backend/incident-service/package.json',
  'backend/user-service/package.json'
];

for (const p of packages) {
  const fullPath = path.join(__dirname, p);
  if (fs.existsSync(fullPath)) {
    const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies['@onalert/shared'] = '*';
    fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2));
    console.log(`Updated ${p}`);
  }
}
