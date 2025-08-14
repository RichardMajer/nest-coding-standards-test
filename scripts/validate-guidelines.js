#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const GitHelpers = require('./utils/git-helpers');

// Import pravidiel
const FileNamingRule = require('./rules/file-naming');
const InterfaceNamingRule = require('./rules/interface-naming');
const ControllerRules = require('./rules/controller-rules');

class CodingGuidelinesValidator {
    constructor() {
        this.rules = [
            FileNamingRule,
            InterfaceNamingRule,
            ControllerRules
        ];
        this.errors = [];
        this.warnings = [];

        // Detekcia podpory hyperlinks
        this.supportsHyperlinks = this.detectHyperlinkSupport();
    }

    detectHyperlinkSupport() {
        // Rozšírená detekcia terminálů ktoré podporujú OSC 8 hyperlinks
        const termProgram = process.env.TERM_PROGRAM || '';
        const term = process.env.TERM || '';
        const terminalApp = process.env.TERMINAL_EMULATOR || '';

        return (
            termProgram === 'vscode' ||           // VS Code Terminal
            termProgram === 'iTerm.app' ||        // iTerm2
            termProgram.includes('iTerm') ||      // iTerm varianty
            process.env.WT_SESSION ||             // Windows Terminal
            termProgram === 'Hyper' ||            // Hyper Terminal
            termProgram === 'WezTerm' ||          // WezTerm
            termProgram === 'Alacritty' ||        // Alacritty
            terminalApp === 'JetBrains-JediTerm' || // JetBrains IDEs
            term.includes('xterm') ||             // xterm varianty
            term.includes('screen') ||            // screen/tmux
            process.env.COLORTERM === 'truecolor' // Moderné terminály s truecolor
        );
    }

    async validate(options = {}) {
        const {files, checkAll, baseBranch, verbose} = options;

        let filesToCheck = [];

        if (files && files.length > 0) {
            // Špecifické súbory
            filesToCheck = files.filter(file => fs.existsSync(file));
            if (verbose) {
                console.log(`🔍 Kontrolujem špecifické súbory: ${filesToCheck.join(', ')}`);
            }
        } else if (checkAll) {
            // Všetky TypeScript súbory v projekte
            filesToCheck = this.getAllTypeScriptFiles();
            if (verbose) {
                console.log(`🔍 Kontrolujem všetky TypeScript súbory (${filesToCheck.length} súborov)`);
            }
        } else {
            // Len zmenené súbory
            if (baseBranch) {
                filesToCheck = GitHelpers.getChangedFilesAgainstBranch(baseBranch);
            } else {
                filesToCheck = GitHelpers.getChangedFiles();
            }

            if (filesToCheck.length === 0) {
                console.log('✅ Žiadne zmenené TypeScript súbory na kontrolu.');
                return {success: true, errors: 0, warnings: 0};
            }

            if (verbose) {
                console.log(`🔍 Kontrolujem zmenené súbory: ${filesToCheck.join(', ')}`);
            }
        }

        // Spustenie validácie
        for (const file of filesToCheck) {
            await this.validateFile(file, verbose);
        }

        return this.generateReport(verbose);
    }

    async validateFile(filePath, verbose = false) {
        if (verbose) {
            console.log(`  📄 Kontrolujem: ${filePath}`);
        }

        for (const Rule of this.rules) {
            try {
                const ruleErrors = Rule.validate(filePath);

                ruleErrors.forEach(error => {
                    if (error.severity === 'error') {
                        this.errors.push(error);
                    } else {
                        this.warnings.push(error);
                    }
                });
            } catch (error) {
                console.warn(`⚠️  Chyba pri aplikovaní pravidla ${Rule.name} na súbor ${filePath}: ${error.message}`);
            }
        }
    }

    getAllTypeScriptFiles() {
        const files = [];

        const searchDirs = ['src', 'lib', 'app'];
        const excludeDirs = ['node_modules', 'dist', 'build', '.git'];

        const searchInDir = (dir) => {
            if (!fs.existsSync(dir)) return;

            const items = fs.readdirSync(dir);

            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (!excludeDirs.some(excludeDir => fullPath.includes(excludeDir))) {
                        searchInDir(fullPath);
                    }
                } else if (fullPath.endsWith('.ts') && !fullPath.endsWith('.spec.ts') && !fullPath.endsWith('.test.ts')) {
                    files.push(fullPath);
                }
            });
        };

        // Hľadáme v obvyklých miestach
        searchDirs.forEach(dir => searchInDir(dir));

        // Ak nenájdeme žiadne súbory, skúsime aktuálny adresár
        if (files.length === 0) {
            searchInDir('.');
        }

        return files;
    }

    generateReport(verbose = false) {
        const totalErrors = this.errors.length;
        const totalWarnings = this.warnings.length;

        if (totalErrors === 0 && totalWarnings === 0) {
            console.log('✅ Všetky coding guidelines sú splnené!');
            return {success: true, errors: 0, warnings: 0};
        }

        console.log('\n📋 VÝSLEDKY VALIDÁCIE:');
        console.log('='.repeat(50));

        // Zoskupenie chýb podľa súborov
        const errorsByFile = this.groupByFile([...this.errors, ...this.warnings]);

        Object.keys(errorsByFile).forEach(file => {
            const fileErrors = errorsByFile[file];
            const fileErrorCount = fileErrors.filter(e => e.severity === 'error').length;
            const fileWarningCount = fileErrors.filter(e => e.severity === 'warning').length;

            console.log(`\n📄 ${file}`);
            if (fileErrorCount > 0) {
                console.log(`   ❌ Chyby: ${fileErrorCount}`);
            }
            if (fileWarningCount > 0) {
                console.log(`   ⚠️  Varovania: ${fileWarningCount}`);
            }

            // Aj v basic mode ukáž prvé pár chýb s clickable links
            if (!verbose && fileErrors.length > 0) {
                const firstErrors = fileErrors.slice(0, 3); // Ukáž len prvé 3 chyby
                firstErrors.forEach(error => {
                    const icon = error.severity === 'error' ? '❌' : '⚠️';
                    const location = error.line ? `:${error.line}:${error.column || 0}` : '';

                    if (this.supportsHyperlinks) {
                        // Vytvoríme clickable link - podporuje VS Code a iné editory
                        const path = require('path');
                        const absolutePath = path.resolve(error.file);
                        const linkText = `${error.file}${location}`;

                        // Optimalizované pre JetBrains IDE - použije file:// s line query parametrom
                        const linkUrl = `file://${absolutePath}${error.line ? `:${error.line}` : ''}`;

                        // OSC 8 hyperlink s optimalizovaným URL + farebné zvýraznenie
                        const fileHyperlink = `\x1b]8;;${linkUrl}\x1b\\\x1b[34m\x1b[4m${linkText}\x1b[0m\x1b]8;;\x1b\\`;

                        console.log(`     ${icon} ${error.rule} → ${fileHyperlink}`);
                    } else {
                        // Fallback - obyčajný text
                        console.log(`     ${icon} ${error.rule} → ${error.file}${location}`);
                    }
                });
                if (fileErrors.length > 3) {
                    console.log(`     ... a ${fileErrors.length - 3} ďalších`);
                }
            }

            if (verbose) {
                fileErrors.forEach(error => {
                    const icon = error.severity === 'error' ? '❌' : '⚠️';
                    const location = error.line ? `:${error.line}:${error.column || 0}` : '';
                    console.log(`     ${icon} ${error.rule}: ${error.message}`);

                    if (this.supportsHyperlinks) {
                        // Vytvoríme clickable link pre verbose mode - optimalizované pre JetBrains IDE
                        const path = require('path');
                        const absolutePath = path.resolve(error.file);
                        const fileUrl = `file://${absolutePath}${error.line ? `:${error.line}` : ''}`;
                        const linkText = `${error.file}${location}`;

                        // OSC 8 hyperlink format s farebným zvýraznením
                        const hyperlink = `\x1b]8;;${fileUrl}\x1b\\\x1b[34m\x1b[4m${linkText}\x1b[0m\x1b]8;;\x1b\\`;
                        console.log(`        📍 ${hyperlink}`);
                    } else {
                        // Fallback - obyčajný text
                        console.log(`        📍 ${error.file}${location}`);
                    }
                });
            }
        });

        console.log('\n📊 SÚHRN:');
        console.log(`   ❌ Celkové chyby: ${totalErrors}`);
        console.log(`   ⚠️  Celkové varovania: ${totalWarnings}`);

        if (!verbose && (totalErrors > 0 || totalWarnings > 0)) {
            console.log('\n💡 Pre detailné informácie spustite s parametrom --verbose');
        }
    

        const success = totalErrors === 0;
        return {
            success,
            errors: totalErrors,
            warnings: totalWarnings,
            details: {errors: this.errors, warnings: this.warnings}
        };
    }

    groupByFile(items) {
        const grouped = {};
        items.forEach(item => {
            if (!grouped[item.file]) {
                grouped[item.file] = [];
            }
            grouped[item.file].push(item);
        });
        return grouped;
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const options = {
        files: [],
        checkAll: false,
        baseBranch: null,
        verbose: false
    };

    // Parsovanie argumentov
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--help' || arg === '-h') {
            printHelp();
            process.exit(0);
        } else if (arg === '--all') {
            options.checkAll = true;
        } else if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        } else if (arg === '--branch' || arg === '-b') {
            options.baseBranch = args[++i];
        } else if (!arg.startsWith('-')) {
            // Súbor na kontrolu
            options.files.push(arg);
        }
    }

    console.log('🚀 NestJS Coding Guidelines Validator');
    console.log('=====================================');

    const validator = new CodingGuidelinesValidator();

    if (options.verbose) {
        console.log(`🔗 Hyperlink podpora: ${validator.supportsHyperlinks ? 'ÁNO' : 'NIE'} (${process.env.TERM_PROGRAM || process.env.TERM || 'neznámy terminál'})`);
    }
    const result = await validator.validate(options);

    process.exit(result.success ? 0 : 1);
}

function printHelp() {
    console.log(`
🚀 NestJS Coding Guidelines Validator

POUŽITIE:
  npm run guidelines              # Kontrola len zmenených súborov
  npm run guidelines --all        # Kontrola všetkých súborov
  npm run guidelines file1.ts     # Kontrola špecifických súborov
  npm run guidelines --branch main # Kontrola zmien oproti branch
  
MOŽNOSTI:
  --all, -a           Kontrola všetkých TypeScript súborov v projekte
  --verbose, -v       Zobrazenie detailných informácií o chybách
  --branch <name>, -b Kontrola zmien oproti špecifickému branch (default: main)
  --help, -h          Zobrazenie tejto pomoci

PRAVIDLÁ:
  • Súbory musia začínať veľkým písmenom (Test.ts)
  • Interfaces musia začínať písmenom "I" (IUser)
  • Controller actions musia vracať DTO objekty

PRÍKLADY:
  npm run guidelines
  npm run guidelines --verbose
  npm run guidelines --all
  npm run guidelines src/users/user.controller.ts
  npm run guidelines --branch develop
`);
}

// Spustenie len ak je script volaný priamo
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Neočakávaná chyba:', error.message);
        process.exit(1);
    });
}

module.exports = CodingGuidelinesValidator;
