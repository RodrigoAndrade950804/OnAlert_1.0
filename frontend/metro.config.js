const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Encuentra el root del workspace
const workspaceRoot = path.resolve(__dirname, '..');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Agrega el root del workspace a watchFolders para que metro lo vigile
config.watchFolders = [workspaceRoot];

// Asegúrate de que Metro resuelva node_modules del workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Opcional: deshabilita la deduplicación estricta para ciertos módulos compartidos si fallan
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
