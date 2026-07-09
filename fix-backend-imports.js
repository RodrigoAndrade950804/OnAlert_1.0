const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

function updateBackendImports(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.ts')) return;
  if (filePath.includes('node_modules')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Si importaba algo relativo que sube niveles y busca types
  if (content.match(/require\(['"]\.\.\/.*?types['"]\)/)) {
    content = content.replace(/require\(['"]\.\.\/.*?types['"]\)/g, "require('@onalert/shared')");
    changed = true;
  }
  
  // utils, constants, etc.
  if (content.match(/require\(['"]\.\.\/.*?utils.*?['"]\)/)) {
    content = content.replace(/require\(['"]\.\.\/.*?utils.*?['"]\)/g, "require('@onalert/shared/utils')"); // Approximation
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated backend imports in ${filePath}`);
  }
}

walk(path.join(__dirname, 'backend'), updateBackendImports);
