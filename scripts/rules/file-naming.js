const path = require('path');

class FileNamingRule {
  static name = 'file-naming';
  static description = 'Súbory musia začínať veľkým písmenom (napr. Test.ts)';

  static validate(filePath) {
    const errors = [];
    const fileName = path.basename(filePath, '.ts');
    
    // Výnimky pre špecifické typy súborov
    const exceptions = [
      'main.ts',
      'index.ts',
      'app.module.ts',
      'app.controller.ts',
      'app.service.ts'
    ];
    
    const baseFileName = path.basename(filePath);
    
    // Ak je súbor v zozname výnimiek, preskočíme kontrolu
    if (exceptions.includes(baseFileName.toLowerCase())) {
      return errors;
    }
    
    // Kontrola či názov súboru začína veľkým písmenom
    if (!/^[A-Z]/.test(fileName)) {
      errors.push({
        rule: this.name,
        file: filePath,
        message: `Názov súboru '${baseFileName}' musí začínať veľkým písmenom. Očakávaný formát: 'NázovSúboru.ts'`,
        line: null,
        column: null,
        severity: 'error'
      });
    }
    
    // Kontrola povolených znakov (len písmená, čísla, pomlčky, bodky)
    if (!/^[A-Za-z0-9.-]+\.ts$/.test(baseFileName)) {
      errors.push({
        rule: this.name,
        file: filePath,
        message: `Názov súboru '${baseFileName}' obsahuje nepovolené znaky. Povolené sú len písmená, čísla, pomlčky a bodky.`,
        line: null,
        column: null,
        severity: 'error'
      });
    }
    
    // Odporúčanie pre kebab-case vs PascalCase
    if (fileName.includes('-') || fileName.includes('_')) {
      errors.push({
        rule: this.name,
        file: filePath,
        message: `Názov súboru '${baseFileName}' by mal používať PascalCase namiesto kebab-case alebo snake_case. Odporúčaný názov: '${this.convertToPascalCase(fileName)}.ts'`,
        line: null,
        column: null,
        severity: 'warning'
      });
    }
    
    return errors;
  }
  
  static convertToPascalCase(str) {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}

module.exports = FileNamingRule;