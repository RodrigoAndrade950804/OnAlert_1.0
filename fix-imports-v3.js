const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

function updateImports(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const replace = (regex, replacement) => {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    }
  };

  // Replace sub-paths with root module
  replace(/['"]@onalert\/shared\/utils\/.*?['"]/g, "'@onalert/shared'");
  replace(/['"]@onalert\/shared\/constants\/.*?['"]/g, "'@onalert/shared'");
  
  // also fix frontend/app/index.tsx -> ../src/presentation/components/SOSButton instead of ../components/SOSButton
  // and context/AlertContext instead of ../context/AlertContext
  if (filePath.includes('app\\(tabs)\\index.tsx')) {
    replace(/['"]\.\.\/components\/SOSButton['"]/g, "'../src/presentation/components/SOSButton'");
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in ${filePath}`);
  }
}

walk(path.join(__dirname, 'frontend'), updateImports);
