# NestJS Coding Guidelines Validator

Nástroj na kontrolu coding guidelines pre NestJS projekty s **klikateľnými odkazmi** v JetBrains IDE a VS Code termináloch. Kontroluje len **zmenené súbory**, takže môžeš postupne aplikovať pravidlá na nový kód.

## 🚀 Inštalácia do existujúceho NestJS projektu

### 1. Skopíruj guidelines priečinok
```bash
# Skopíruj celý guidelines priečinok do root tvojho NestJS projektu
cp -r guidelines/ /path/to/your/nestjs/project/
```

### 2. Nainštaluj dependencies
```bash
# V tvojom NestJS projekte
cd /path/to/your/nestjs/project/
npm install --save-dev @typescript-eslint/parser@^6.0.0 typescript@^5.0.0
```

### 3. Pridaj scripts do package.json
```json
{
  "scripts": {
    "guidelines": "node guidelines/scripts/validate-guidelines.js",
    "guidelines:all": "node guidelines/scripts/validate-guidelines.js --all", 
    "guidelines:verbose": "node guidelines/scripts/validate-guidelines.js --verbose",
    "guidelines:help": "node guidelines/scripts/validate-guidelines.js --help"
  }
}
```

### 4. (Voliteľné) Pridaj do git hooks
```json
// package.json
{
  "scripts": {
    "precommit": "npm run guidelines"
  }
}
```

## 📋 Použitie

```bash
# Kontrola len zmenených súborov (odporúčané)
npm run guidelines

# Kontrola všetkých súborov v projekte
npm run guidelines:all

# Detailné informácie o chybách s klikateľnými odkazmi
npm run guidelines:verbose

# Nápoveda
npm run guidelines:help

# Kontrola špecifických súborov
node guidelines/scripts/validate-guidelines.js src/users/user.controller.ts

# Kontrola zmien oproti konkrétnemu branch
node guidelines/scripts/validate-guidelines.js --branch main
```

## 🎯 Funkcie

✅ **Klikateľné odkazy** - navigácia na presný riadok v súbore  
✅ **JetBrains IDE optimalizácia** - funguje v IntelliJ IDEA, WebStorm, atd.  
✅ **VS Code podpora** - funguje aj v VS Code terminále  
✅ **Git integrácia** - automaticky detekuje zmenené súbory  
✅ **Farebné zvýraznenie** - odkazy sú modré a podčiarknuté  
✅ **Copy&paste fallback** - ak odkazy nefungujú  

## 📋 Aktuálne pravidlá

### 1. **Názvy súborov**
- Súbory musia začínať **veľkým písmenom**
- Formát: `NázovSúboru.ts`
- ✅ Správne: `User.controller.ts`, `UserService.ts`
- ❌ Nesprávne: `user.controller.ts`, `userService.ts`

### 2. **Interface naming**
- Všetky interfaces musia začínať písmenom **"I"**
- Formát: `INázovInterface`
- ✅ Správne: `IUser`, `IUserService`, `ICreateUserDto`
- ❌ Nesprávne: `User`, `UserInterface`

### 3. **Controller return types**
- Všetky controller actions musia mať **definovaný return type**
- Return type musí byť **DTO objekt** (nie primitive type)
- ✅ Správne: `CreateUserResponseDto`, `UserDto[]`, `Promise<UserDto>`
- ❌ Nesprávne: `string`, `any`, bez return type

## 🛠 Ako funguje

1. **Git integrácia** - automaticky detekuje zmenené súbory pomocou `git diff`
2. **AST parsing** - analyzuje TypeScript kód pomocou `@typescript-eslint/parser`
3. **Modulárne pravidlá** - každé pravidlo je samostatný modul
4. **Postupná aplikácia** - kontroluje len nové zmeny, nie celý existujúci kód
5. **Hyperlinky** - generuje OSC 8 klikateľné odkazy pre moderné terminály

## 📁 Štruktúra

```
guidelines/
├── package.json             # Dependencies a scripts
├── README.md               # Táto dokumentácia  
└── scripts/
    ├── validate-guidelines.js    # Hlavný script
    ├── rules/
    │   ├── file-naming.js       # Kontrola názvov súborov
    │   ├── interface-naming.js  # Kontrola interface names
    │   └── controller-rules.js  # Kontrola controller DTO returns
    └── utils/
        └── git-helpers.js       # Git integrácia
```

## 🔧 Rozšírenie pravidiel

Pre pridanie nového pravidla:

1. Vytvor nový súbor v `guidelines/scripts/rules/`
2. Implementuj `validate(filePath)` metódu
3. Pridaj rule do `guidelines/scripts/validate-guidelines.js`

Príklad nového pravidla:

```javascript
class MyCustomRule {
  static name = 'my-custom-rule';
  static description = 'Popis pravidla';

  static validate(filePath) {
    const errors = [];
    // Tvoja validačná logika
    return errors;
  }
}

module.exports = MyCustomRule;
```

## 🚨 Exit codes

Script vráti exit code:
- `0` - všetko OK
- `1` - našli sa chyby

Možeš ho použiť v CI/CD pipeline alebo git hooks.

## 🎮 Terminal podpora

Klikateľné odkazy fungujú v:
- ✅ **JetBrains IDEs** (IntelliJ IDEA, WebStorm, PHPStorm, atd.)
- ✅ **VS Code Terminal**
- ✅ **iTerm2** (macOS)
- ✅ **Windows Terminal**
- ✅ **Hyper Terminal**

Ak nefungujú odkazy, použite copy&paste príkazy na konci výstupu.

## 📦 Dependencies

- `@typescript-eslint/parser` - na parsing TypeScript kódu
- `typescript` - TypeScript support

## 📄 Licencia

MIT