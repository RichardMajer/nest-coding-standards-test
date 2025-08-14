const fs = require('fs');
const { parse } = require('@typescript-eslint/parser');

class InterfaceNamingRule {
  static name = 'interface-naming';
  static description = 'Interfaces musia začínať písmenom "I" (napr. IUser)';

  static validate(filePath) {
    const errors = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const ast = parse(content, {
        range: true,
        loc: true,
        tokens: true,
        comment: true,
        sourceType: 'module',
        ecmaVersion: 2020,
        ecmaFeatures: {
          tsx: filePath.endsWith('.tsx')
        }
      });

      this.checkInterfaces(ast, errors, filePath, content);
    } catch (error) {
      // Ak sa nepodarí parsovať súbor, môže to byť kvôli syntax errors
      // Použijeme regex ako fallback
      this.validateWithRegex(filePath, errors);
    }

    return errors;
  }

  static checkInterfaces(node, errors, filePath, content) {
    if (!node) return;

    if (node.type === 'TSInterfaceDeclaration') {
      const interfaceName = node.id.name;
      
      if (!interfaceName.startsWith('I') || interfaceName.length < 2 || !/^I[A-Z]/.test(interfaceName)) {
        const lines = content.split('\n');
        errors.push({
          rule: this.name,
          file: filePath,
          message: `Interface '${interfaceName}' musí začínať písmenom "I" nasledovaným veľkým písmenom (napr. IUser, IUserService). Aktuálny názov: '${interfaceName}'`,
          line: node.loc.start.line,
          column: node.loc.start.column,
          severity: 'error'
        });
      }

      // Kontrola či má interface zmysluplný názov
      if (interfaceName === 'I' || interfaceName.length <= 2) {
        errors.push({
          rule: this.name,
          file: filePath,
          message: `Interface názov '${interfaceName}' je príliš krátky. Interface by mal mať popisný názov ako IUser, IUserService, atď.`,
          line: node.loc.start.line,
          column: node.loc.start.column,
          severity: 'error'
        });
      }
    }

    // Rekurzívne prehľadávanie potomkov
    for (const key in node) {
      if (key === 'parent' || key === 'tokens' || key === 'comments') continue;
      
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(grandchild => {
          if (grandchild && typeof grandchild === 'object') {
            this.checkInterfaces(grandchild, errors, filePath, content);
          }
        });
      } else if (child && typeof child === 'object') {
        this.checkInterfaces(child, errors, filePath, content);
      }
    }
  }

  static validateWithRegex(filePath, errors) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Regex na nájdenie interface deklarácií
      const interfaceRegex = /interface\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
      let match;
      
      while ((match = interfaceRegex.exec(content)) !== null) {
        const interfaceName = match[1];
        
        if (!interfaceName.startsWith('I') || interfaceName.length < 2 || !/^I[A-Z]/.test(interfaceName)) {
          // Nájdeme line number
          const beforeMatch = content.substring(0, match.index);
          const lineNumber = beforeMatch.split('\n').length;
          
          errors.push({
            rule: this.name,
            file: filePath,
            message: `Interface '${interfaceName}' musí začínať písmenom "I" nasledovaným veľkým písmenom (napr. IUser). Aktuálny názov: '${interfaceName}'`,
            line: lineNumber,
            column: match.index - beforeMatch.lastIndexOf('\n'),
            severity: 'error'
          });
        }
      }
    } catch (error) {
      errors.push({
        rule: this.name,
        file: filePath,
        message: `Nemôžem čítať súbor pre kontrolu interface názvov: ${error.message}`,
        line: null,
        column: null,
        severity: 'warning'
      });
    }
  }
}

module.exports = InterfaceNamingRule;