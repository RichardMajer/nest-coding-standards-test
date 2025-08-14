# Inštalácia NestJS Coding Guidelines

## 🚀 Rýchla inštalácia

### 1. Skopíruj priečinok do tvojho NestJS projektu
```bash
# Skopíruj celý guidelines priečinok do root tvojho NestJS projektu
cp -r guidelines/ /path/to/your/nestjs-project/
```

### 2. Spusti automatický installer
```bash
# V root priečinku tvojho NestJS projektu
cd /path/to/your/nestjs-project/
node guidelines/install.js
```

### 3. Nainštaluj dependencies
```bash
npm install
```

### 4. Spusti guidelines
```bash
npm run guidelines
```

## 🎯 Čo installer urobí

✅ Pridá scripts do tvojho `package.json`:
- `npm run guidelines` - kontrola zmenených súborov
- `npm run guidelines:all` - kontrola všetkých súborov  
- `npm run guidelines:verbose` - detailný výstup
- `npm run guidelines:help` - nápoveda

✅ Pridá potrebné devDependencies:
- `@typescript-eslint/parser`
- `typescript`

## 📋 Manuálna inštalácia

Ak nechceš použiť installer, môžeš pridať manuálne:

### package.json
```json
{
  "scripts": {
    "guidelines": "node guidelines/scripts/validate-guidelines.js",
    "guidelines:all": "node guidelines/scripts/validate-guidelines.js --all",
    "guidelines:verbose": "node guidelines/scripts/validate-guidelines.js --verbose", 
    "guidelines:help": "node guidelines/scripts/validate-guidelines.js --help"
  },
  "devDependencies": {
    "@typescript-eslint/parser": "^6.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 🔧 Git Hooks (voliteľné)

Pre automatickú kontrolu pri každom commite:

```json
{
  "scripts": {
    "precommit": "npm run guidelines"
  }
}
```

Alebo použiť husky:
```bash
npm install --save-dev husky
npx husky add .husky/pre-commit "npm run guidelines"
```

## ✨ Prvé spustenie

```bash
# Kontrola zmenených súborov
npm run guidelines

# Ak máš chyby, pozri si ich s klikateľnými odkazmi
npm run guidelines:verbose

# Kontrola všetkých súborov (prvé spustenie)
npm run guidelines:all
```

## 🎮 Terminálová podpora

Klikateľné odkazy fungujú najlepšie v:
- **JetBrains IDEs** (IntelliJ IDEA, WebStorm, PHPStorm)
- **VS Code Terminal**
- **iTerm2** (macOS)
- **Windows Terminal**

## 📖 Viac informácií

Pozri [README.md](./README.md) pre úplnú dokumentáciu.