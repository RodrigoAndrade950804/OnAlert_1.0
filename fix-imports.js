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

  // Reemplazar ../types por @onalert/shared
  if (content.includes('../types') || content.includes('../../types')) {
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"](?:\.\.\/)+types['"]/g, "import { $1 } from '@onalert/shared'");
    changed = true;
  }
  
  // Reemplazar ../constants/theme por @onalert/shared
  if (content.includes('../constants') || content.includes('../../constants')) {
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"](?:\.\.\/)+constants\/theme['"]/g, "import { $1 } from '@onalert/shared'");
    changed = true;
  }

  // Si estamos en frontend/app/, los componentes ahora están en ../src/presentation/components
  if (filePath.includes(path.join('frontend', 'app'))) {
    content = content.replace(/['"]\.\.\/components\//g, "'../src/presentation/components/");
    content = content.replace(/['"]\.\.\/context\//g, "'../src/application/context/");
    content = content.replace(/['"]\.\.\/utils\//g, "'@onalert/shared/utils/"); // Asumiendo que utils se exportarán o importarán directo
    content = content.replace(/['"]\.\.\/application\//g, "'../src/application/");
    changed = true;
  }

  // Si estamos en presentation/components, context está en ../../application/context
  if (filePath.includes(path.join('src', 'presentation', 'components'))) {
    content = content.replace(/['"]\.\.\/context\//g, "'../../application/context/");
    content = content.replace(/['"]\.\.\/utils\//g, "'@onalert/shared/utils/");
    content = content.replace(/['"]\.\.\/application\//g, "'../../application/");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in ${filePath}`);
  }
}

// Mover application (usecases) a src/application/usecases
const oldAppDir = path.join(__dirname, 'frontend', 'application');
const newAppDir = path.join(__dirname, 'frontend', 'src', 'application', 'usecases');
if (fs.existsSync(oldAppDir)) {
  fs.renameSync(oldAppDir, newAppDir);
  console.log('Moved application to src/application/usecases');
}

walk(path.join(__dirname, 'frontend'), updateImports);
