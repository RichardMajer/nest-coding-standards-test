#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 NestJS Coding Guidelines Installer');
console.log('=====================================');

// Skontroluj či sme v root priečinku NestJS projektu
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json nie je nájdený. Spusti tento script v root priečinku tvojho NestJS projektu.');
  process.exit(1);
}

try {
  // Načítaj existujúci package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log('📦 Pridávam guidelines scripts do package.json...');
  
  // Pridaj guidelines scripts
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  packageJson.scripts.guidelines = 'node guidelines/scripts/validate-guidelines.js';
  packageJson.scripts['guidelines:all'] = 'node guidelines/scripts/validate-guidelines.js --all';
  packageJson.scripts['guidelines:verbose'] = 'node guidelines/scripts/validate-guidelines.js --verbose';
  packageJson.scripts['guidelines:help'] = 'node guidelines/scripts/validate-guidelines.js --help';
  
  // Pridaj dev dependencies
  console.log('📋 Pridávam dev dependencies...');
  
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  
  // Pridaj len ak neexistujú
  if (!packageJson.devDependencies['@typescript-eslint/parser']) {
    packageJson.devDependencies['@typescript-eslint/parser'] = '^6.0.0';
  }
  
  if (!packageJson.devDependencies['typescript']) {
    packageJson.devDependencies['typescript'] = '^5.0.0';
  }
  
  // Zapíš upravený package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log('✅ Guidelines úspešne nainštalované!');
  console.log('');
  console.log('🔧 Ďalšie kroky:');
  console.log('   1. npm install               # Nainštaluj dependencies');
  console.log('   2. npm run guidelines        # Spusti kontrolu guidelines');
  console.log('   3. npm run guidelines:help   # Zobraz nápovedu');
  console.log('');
  console.log('🎯 Dostupné príkazy:');
  console.log('   npm run guidelines           # Kontrola zmenených súborov');
  console.log('   npm run guidelines:all       # Kontrola všetkých súborov');
  console.log('   npm run guidelines:verbose   # Detailné informácie');
  console.log('');
  console.log('📖 Viac informácií: guidelines/README.md');
  
} catch (error) {
  console.error('❌ Chyba pri inštalácii:', error.message);
  process.exit(1);
}