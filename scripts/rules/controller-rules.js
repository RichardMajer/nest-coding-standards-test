const fs = require('fs');
const { parse } = require('@typescript-eslint/parser');

class ControllerRules {
  static name = 'controller-rules';
  static description = 'Controller actions musia vracať DTO objekty';

  static validate(filePath) {
    const errors = [];
    
    // Kontrolujeme len controller súbory
    if (!this.isControllerFile(filePath)) {
      return errors;
    }

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

      this.checkControllerMethods(ast, errors, filePath, content);
    } catch (error) {
      // Fallback na regex ak AST parsing zlyhá
      this.validateWithRegex(filePath, errors);
    }

    return errors;
  }

  static isControllerFile(filePath) {
    const fileName = filePath.toLowerCase();
    return fileName.includes('controller') || fileName.endsWith('.controller.ts');
  }

  static checkControllerMethods(node, errors, filePath, content) {
    if (!node) return;

    // Kontrola či je to class s @Controller dekorátorom
    if (node.type === 'ClassDeclaration' && this.hasControllerDecorator(node)) {
      this.checkClassMethods(node, errors, filePath, content);
    }

    // Rekurzívne prehľadávanie
    for (const key in node) {
      if (key === 'parent' || key === 'tokens' || key === 'comments') continue;
      
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(grandchild => {
          if (grandchild && typeof grandchild === 'object') {
            this.checkControllerMethods(grandchild, errors, filePath, content);
          }
        });
      } else if (child && typeof child === 'object') {
        this.checkControllerMethods(child, errors, filePath, content);
      }
    }
  }

  static hasControllerDecorator(classNode) {
    if (!classNode.decorators) return false;
    
    return classNode.decorators.some(decorator => {
      if (decorator.expression.type === 'CallExpression') {
        return decorator.expression.callee.name === 'Controller';
      }
      return decorator.expression.name === 'Controller';
    });
  }

  static checkClassMethods(classNode, errors, filePath, content) {
    const methods = classNode.body.body.filter(member => 
      member.type === 'MethodDefinition' && member.key.type === 'Identifier'
    );

    methods.forEach(method => {
      if (this.isHttpMethod(method)) {
        this.validateMethodReturnType(method, errors, filePath, content);
      }
    });
  }

  static isHttpMethod(method) {
    if (!method.decorators) return false;
    
    const httpDecorators = ['Get', 'Post', 'Put', 'Delete', 'Patch', 'Options', 'Head'];
    
    return method.decorators.some(decorator => {
      const decoratorName = decorator.expression.callee ? 
        decorator.expression.callee.name : decorator.expression.name;
      return httpDecorators.includes(decoratorName);
    });
  }

  static validateMethodReturnType(method, errors, filePath, content) {
    const methodName = method.key.name;
    
    // Kontrola return type annotation
    if (!method.value.returnType) {
      errors.push({
        rule: this.name,
        file: filePath,
        message: `Controller metóda '${methodName}' musí mať definovaný return type. Všetky controller actions musia vracať DTO objekty.`,
        line: method.loc.start.line,
        column: method.loc.start.column,
        severity: 'error'
      });
      return;
    }

    const returnType = this.getReturnTypeString(method.value.returnType);
    
    // Kontrola či return type vyzerá ako DTO
    if (!this.isValidDtoReturnType(returnType)) {
      errors.push({
        rule: this.name,
        file: filePath,
        message: `Controller metóda '${methodName}' má return type '${returnType}', ale očakáva sa DTO objekt (napr. UserDto, CreateUserResponseDto). Primitive typy alebo 'any' nie sú povolené.`,
        line: method.value.returnType.loc.start.line,
        column: method.value.returnType.loc.start.column,
        severity: 'error'
      });
    }

    // Kontrola async/await pattern
    if (returnType.includes('Promise') && !method.value.async) {
      errors.push({
        rule: this.name,
        file: filePath,
        message: `Controller metóda '${methodName}' vracia Promise ale nie je označená ako async.`,
        line: method.loc.start.line,
        column: method.loc.start.column,
        severity: 'warning'
      });
    }
  }

  static getReturnTypeString(returnTypeNode) {
    if (!returnTypeNode || !returnTypeNode.typeAnnotation) return 'unknown';
    
    const typeAnnotation = returnTypeNode.typeAnnotation;
    
    // Jednoduchá extrakcia type string (môže byť rozšírená)
    if (typeAnnotation.type === 'TSTypeReference' && typeAnnotation.typeName) {
      return typeAnnotation.typeName.name || 'unknown';
    }
    
    if (typeAnnotation.type === 'TSStringKeyword') return 'string';
    if (typeAnnotation.type === 'TSNumberKeyword') return 'number';
    if (typeAnnotation.type === 'TSBooleanKeyword') return 'boolean';
    if (typeAnnotation.type === 'TSAnyKeyword') return 'any';
    
    return typeAnnotation.type || 'unknown';
  }

  static isValidDtoReturnType(returnType) {
    // Primitive typy nie sú povolené
    const primitiveTypes = ['string', 'number', 'boolean', 'any', 'unknown', 'void'];
    if (primitiveTypes.includes(returnType.toLowerCase())) {
      return false;
    }

    // DTO konvencie - môže končiť na Dto alebo ResponseDto
    if (returnType.endsWith('Dto') || returnType.endsWith('Response') || returnType.endsWith('Entity')) {
      return true;
    }

    // Promise wrapper je OK ak obsahuje DTO
    if (returnType.includes('Promise')) {
      return true; // Detailnejšiu kontrolu Promise<T> môžeme pridať neskôr
    }

    // Array wrapper je OK
    if (returnType.includes('Array') || returnType.endsWith('[]')) {
      return true;
    }

    // Kontrola či to vyzerá ako class/interface názov (začína veľkým písmenom)
    if (/^[A-Z][A-Za-z0-9]*$/.test(returnType)) {
      return true;
    }

    return false;
  }

  static validateWithRegex(filePath, errors) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Regex na nájdenie controller metód s HTTP dekorátorom
      const methodRegex = /@(Get|Post|Put|Delete|Patch|Options|Head).*?\n\s*(async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
      let match;
      
      while ((match = methodRegex.exec(content)) !== null) {
        const methodName = match[3];
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        
        // Základná kontrola - či má return type
        const methodStart = match.index;
        const methodDeclaration = content.substring(methodStart, content.indexOf('{', methodStart));
        
        if (!methodDeclaration.includes(':')) {
          errors.push({
            rule: this.name,
            file: filePath,
            message: `Controller metóda '${methodName}' musí mať definovaný return type (DTO objekt).`,
            line: lineNumber,
            column: 0,
            severity: 'error'
          });
        }
      }
    } catch (error) {
      errors.push({
        rule: this.name,
        file: filePath,
        message: `Nemôžem kontrolovať controller pravidlá: ${error.message}`,
        line: null,
        column: null,
        severity: 'warning'
      });
    }
  }
}

module.exports = ControllerRules;