# NestJS Coding Guidelines Validator

Nástroj na kontrolu coding guidelines pre NestJS projekty. Kontroluje len **zmenené súbory**, nie celý kód, takže môžeš postupne aplikovať pravidlá na nový kód.

## 🚀 Použitie

```bash
# Nainštaluj dependencies
npm install

# Kontrola len zmenených súborov (odporúčané)
npm run guidelines

# Kontrola všetkých súborov v projekte
npm run guidelines:all

# Detailné informácie o chybách
npm run guidelines:verbose

# Nápoveda
npm run guidelines:help

# Kontrola špecifických súborov
node scripts/validate-guidelines.js src/users/user.controller.ts

# Kontrola zmien oproti konkrétnemu branch
node scripts/validate-guidelines.js --branch main
```

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
2. **AST parsing** - analyzuje TypeScript kód pomocí `@typescript-eslint/parser`
3. **Modulárne pravidlá** - každé pravidlo je samostatný modul
4. **Postupná aplikácia** - kontroluje len nové zmeny, nie celý existujúci kód

## 📁 Štruktúra

```
scripts/
├── validate-guidelines.js    # Hlavný script
├── rules/
│   ├── file-naming.js      # Kontrola názvov súborov
│   ├── interface-naming.js # Kontrola interface names
│   └── controller-rules.js # Kontrola controller DTO returns
└── utils/
    └── git-helpers.js      # Git integrácia
```

## 🔧 Rozšírenie pravidiel

Pre pridanie nového pravidla:

1. Vytvor nový súbor v `scripts/rules/`
2. Implementuj `validate(filePath)` metódu
3. Pridaj rule do `scripts/validate-guidelines.js`

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
```

## 🎯 Výstupy

Script vráti exit code:
- `0` - všetko OK
- `1` - našli sa chyby

Možeš ho použiť v CI/CD pipeline alebo git hooks.

## 📦 Dependencies

- `@typescript-eslint/parser` - na parsing TypeScript kódu
- `typescript` - TypeScript support