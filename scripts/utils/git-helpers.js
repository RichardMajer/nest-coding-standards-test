const { execSync } = require('child_process');
const path = require('path');

class GitHelpers {
  static getChangedFiles() {
    try {
      // Get staged files
      const stagedFiles = this.getStagedFiles();
      // Get unstaged changes
      const unstagedFiles = this.getUnstagedFiles();
      
      // Combine and deduplicate
      const allFiles = [...new Set([...stagedFiles, ...unstagedFiles])];
      
      // Filter only TypeScript files and exclude test files
      return allFiles.filter(file => 
        file.endsWith('.ts') && 
        !file.endsWith('.spec.ts') && 
        !file.endsWith('.test.ts') &&
        !file.includes('node_modules') &&
        !file.includes('dist/')
      );
    } catch (error) {
      console.warn('Git nie je dostupný alebo nie sme v git repository. Použijem alternatívny prístup.');
      return [];
    }
  }

  static getStagedFiles() {
    try {
      const output = execSync('git diff --staged --name-only --diff-filter=AM', { encoding: 'utf8' });
      return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      return [];
    }
  }

  static getUnstagedFiles() {
    try {
      const output = execSync('git diff --name-only --diff-filter=AM', { encoding: 'utf8' });
      return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      return [];
    }
  }

  static getChangedFilesAgainstBranch(baseBranch = 'main') {
    try {
      const output = execSync(`git diff ${baseBranch} --name-only --diff-filter=AM`, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(file => file.length > 0);
      
      // Filter only TypeScript files and exclude test files
      return files.filter(file => 
        file.endsWith('.ts') && 
        !file.endsWith('.spec.ts') && 
        !file.endsWith('.test.ts') &&
        !file.includes('node_modules') &&
        !file.includes('dist/')
      );
    } catch (error) {
      console.warn(`Nemôžem porovnať s branch '${baseBranch}'. Použijem lokálne zmeny.`);
      return this.getChangedFiles();
    }
  }

  static isGitRepository() {
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  static getRepositoryRoot() {
    try {
      const output = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' });
      return output.trim();
    } catch (error) {
      return process.cwd();
    }
  }
}

module.exports = GitHelpers;