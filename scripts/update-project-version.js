#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const version = process.argv[2];
if (!version) {
  console.error('Usage: node update-project-version.js <version>');
  process.exit(1);
}

// Update tauri.conf.json
const tauriConfPath = path.join(__dirname, '../apps/native/src-tauri/tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
tauriConf.version = version;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
console.log(`Updated tauri.conf.json to version ${version}`);

// Update Cargo.toml
const cargoTomlPath = path.join(__dirname, '../apps/native/src-tauri/Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
cargoToml = cargoToml.replace(/^version = ".*"$/m, `version = "${version}"`);
fs.writeFileSync(cargoTomlPath, cargoToml);
console.log(`Updated Cargo.toml to version ${version}`);

// Update constants.ts
const constantsPath = path.join(__dirname, '../libs/shared/utils/src/lib/constants.ts');
if (fs.existsSync(constantsPath)) {
  let constants = fs.readFileSync(constantsPath, 'utf8');
  constants = constants.replace(/export const APP_VERSION = '.*';/, `export const APP_VERSION = '${version}';`);
  fs.writeFileSync(constantsPath, constants);
  console.log(`Updated constants.ts to version ${version}`);
}
