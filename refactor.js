const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend');
const sharedDir = path.join(rootDir, 'shared');

// 1. Crear directorios principales
if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir);
if (!fs.existsSync(sharedDir)) fs.mkdirSync(sharedDir);

// 2. Mover archivos del Frontend
const frontendFiles = [
  'app', 'components', 'context', 'application', 'assets', 'app.json', 
  'babel.config.js', 'tsconfig.json', 'metro.config.js'
];

for (const file of frontendFiles) {
  const oldPath = path.join(rootDir, file);
  const newPath = path.join(frontendDir, file);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${file} to frontend/`);
  }
}

// Renombrar package.json a frontend/package.json
const oldPkgPath = path.join(rootDir, 'package.json');
let oldPkg = {};
if (fs.existsSync(oldPkgPath)) {
  oldPkg = JSON.parse(fs.readFileSync(oldPkgPath, 'utf8'));
  
  const frontendPkg = { ...oldPkg, name: "@onalert/frontend" };
  fs.writeFileSync(path.join(frontendDir, 'package.json'), JSON.stringify(frontendPkg, null, 2));
}

// 3. Crear Root package.json (Workspace)
const rootPkg = {
  name: "onalert-monorepo",
  version: "1.0.0",
  private: true,
  workspaces: [
    "frontend",
    "shared",
    "backend/*"
  ],
  scripts: {
    "start": "npm start -w @onalert/frontend",
    "backend:gateway": "npm start -w gateway",
    "install:all": "npm install"
  }
};
fs.writeFileSync(oldPkgPath, JSON.stringify(rootPkg, null, 2));

// 4. Crear @onalert/shared
const sharedSrc = path.join(sharedDir, 'src');
if (!fs.existsSync(sharedSrc)) fs.mkdirSync(sharedSrc);

const sharedPkg = {
  name: "@onalert/shared",
  version: "1.0.0",
  main: "dist/index.js",
  types: "dist/index.d.ts",
  scripts: {
    "build": "tsc"
  },
  dependencies: {}
};
fs.writeFileSync(path.join(sharedDir, 'package.json'), JSON.stringify(sharedPkg, null, 2));

const sharedTsConfig = {
  compilerOptions: {
    target: "es6",
    module: "commonjs",
    declaration: true,
    outDir: "./dist",
    strict: true
  },
  include: ["src/**/*"]
};
fs.writeFileSync(path.join(sharedDir, 'tsconfig.json'), JSON.stringify(sharedTsConfig, null, 2));

// Mover dependencias compartidas
const moveShared = (folder) => {
  const oldPath = path.join(rootDir, folder);
  const newPath = path.join(sharedSrc, folder);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${folder} to shared/src/`);
  }
};
moveShared('types');
moveShared('constants');
moveShared('utils');

fs.writeFileSync(path.join(sharedSrc, 'index.ts'), `
export * from './types';
export * from './constants/theme';
`);

// 5. Clean Architecture src/
const frontendSrc = path.join(frontendDir, 'src');
if (!fs.existsSync(frontendSrc)) fs.mkdirSync(frontendSrc);
['core', 'application', 'infrastructure', 'presentation'].forEach(dir => {
  if (!fs.existsSync(path.join(frontendSrc, dir))) fs.mkdirSync(path.join(frontendSrc, dir));
});

const presentation = path.join(frontendSrc, 'presentation');
if (fs.existsSync(path.join(frontendDir, 'components'))) {
  fs.renameSync(path.join(frontendDir, 'components'), path.join(presentation, 'components'));
}
if (fs.existsSync(path.join(frontendDir, 'context'))) {
  fs.renameSync(path.join(frontendDir, 'context'), path.join(frontendSrc, 'application', 'context'));
}

if (fs.existsSync(path.join(rootDir, 'services'))) {
  fs.renameSync(path.join(rootDir, 'services'), path.join(frontendSrc, 'infrastructure', 'services'));
}

console.log('Done moving folders!');
