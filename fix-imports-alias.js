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

  // Replace relative paths pointing to src with absolute alias
  replace(/['"](?:\.\.\/)+src\/(.*?)['"]/g, "'@/src/$1'");
  
  // En app/ hay referencias como ../src/... que fallaban porque debían ser ../../src/...
  // Con el regex de arriba, todo eso (sea 1 o 10 ../) se convierte en @/src/...

  // Para los archivos dentro de src/ que importan ../../application/context/AlertContext
  // los cambiamos a @/src/application/context/AlertContext
  replace(/['"](?:\.\.\/)+application\/(.*?)['"]/g, "'@/src/application/$1'");
  replace(/['"](?:\.\.\/)+infrastructure\/(.*?)['"]/g, "'@/src/infrastructure/$1'");
  replace(/['"](?:\.\.\/)+presentation\/(.*?)['"]/g, "'@/src/presentation/$1'");
  replace(/['"](?:\.\.\/)+components\/(.*?)['"]/g, "'@/src/presentation/components/$1'"); // fallback si quedó alguno
  replace(/['"](?:\.\.\/)+context\/(.*?)['"]/g, "'@/src/application/context/$1'");

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated alias imports in ${filePath}`);
  }
}

walk(path.join(__dirname, 'frontend'), updateImports);
