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

  // Reemplazar ../../context/ -> ../application/context (desde presentation/components)
  // Reemplazar ../context/ -> ../../application/context (desde app)
  
  // Vamos a simplificar usando regex que capture cualquier ../ o ../../
  
  // 1. types -> @onalert/shared
  replace(/['"](?:\.\.\/)+types['"]/g, "'@onalert/shared'");
  
  // 2. constants/theme -> @onalert/shared
  replace(/['"](?:\.\.\/)+constants\/theme['"]/g, "'@onalert/shared'");
  
  // 3. utils -> @onalert/shared/utils (Aunque utils no está exportado en index, podemos importarlo así)
  replace(/['"](?:\.\.\/)+utils\/(.*?)['"]/g, "'@onalert/shared/utils/$1'");

  // 4. services -> ../infrastructure/services o ../../infrastructure/services
  // Si estamos en frontend/app, la ruta a services es ../src/infrastructure/services
  // Si estamos en frontend/src/application, la ruta a services es ../infrastructure/services
  if (filePath.includes(path.join('frontend', 'app'))) {
    replace(/['"](?:\.\.\/)+services\/(.*?)['"]/g, "'../src/infrastructure/services/$1'");
    replace(/['"](?:\.\.\/)+context\/(.*?)['"]/g, "'../src/application/context/$1'");
    replace(/['"](?:\.\.\/)+components\/(.*?)['"]/g, "'../src/presentation/components/$1'");
  } else if (filePath.includes(path.join('frontend', 'src', 'presentation'))) {
    replace(/['"](?:\.\.\/)+services\/(.*?)['"]/g, "'../../infrastructure/services/$1'");
    replace(/['"](?:\.\.\/)+context\/(.*?)['"]/g, "'../../application/context/$1'");
    replace(/['"](?:\.\.\/)+application\/(.*?)['"]/g, "'../../application/$1'");
    replace(/['"](?:\.\.\/)+constants\/(.*?)['"]/g, "'@onalert/shared/constants/$1'");
  } else if (filePath.includes(path.join('frontend', 'src', 'application'))) {
    replace(/['"](?:\.\.\/)+services\/(.*?)['"]/g, "'../../infrastructure/services/$1'");
    replace(/['"](?:\.\.\/)+application\/(.*?)['"]/g, "'../../application/$1'"); // ?
    replace(/['"](?:\.\.\/)+constants\/(.*?)['"]/g, "'@onalert/shared/constants/$1'");
  } else if (filePath.includes(path.join('frontend', 'src', 'infrastructure'))) {
    replace(/['"](?:\.\.\/)+constants\/(.*?)['"]/g, "'@onalert/shared/constants/$1'");
  }

  // Casos especiales detectados en los logs
  replace(/['"]\.\.\/\.\.\/constants\/sectors['"]/g, "'@onalert/shared/constants/sectors'");
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in ${filePath}`);
  }
}

walk(path.join(__dirname, 'frontend'), updateImports);
