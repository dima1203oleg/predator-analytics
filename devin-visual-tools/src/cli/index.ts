#!/usr/bin/env node
/**
 * @devin/visual-tools CLI entry point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('devin-visual-tools')
  .description('Zero-configuration visual testing framework for Electron applications')
  .version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize visual testing in your project')
  .option('-f, --force', 'Force re-initialization', false)
  .action(async (options) => {
    await initCommand(options);
  });

// Test command
program
  .command('test')
  .description('Run visual tests')
  .option('-w, --watch', 'Watch mode', false)
  .option('-u, --update-snapshots', 'Update snapshots', false)
  .option('-c, --ci', 'CI mode', false)
  .option('--project <project>', 'Specific project to test')
  .action(async (options) => {
    await testCommand(options);
  });

// Parse arguments
program.parse(process.argv);

/**
 * Initialize visual testing in the current project
 */
async function initCommand(options: { force: boolean }) {
  const spinner = ora('Initializing @devin/visual-tools...').start();
  
  try {
    const projectRoot = process.cwd();
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    // Check if package.json exists
    if (!await fs.pathExists(packageJsonPath)) {
      spinner.fail('package.json not found. Are you in a Node.js project?');
      process.exit(1);
    }
    
    // Read package.json
    const packageJson = await fs.readJson(packageJsonPath);
    
    spinner.text = 'Analyzing project structure...';
    
    // Detect project type
    const projectType = detectProjectType(packageJson);
    spinner.text = `Detected ${projectType} project...`;
    
    // Check if already initialized
    const configPath = path.join(projectRoot, 'devin-visual.config.ts');
    if (await fs.pathExists(configPath) && !options.force) {
      spinner.warn('@devin/visual-tools already initialized. Use --force to re-initialize.');
      
      const { reinit } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'reinit',
          message: 'Do you want to re-initialize anyway?',
          default: false,
        }
      ]);
      
      if (!reinit) {
        process.exit(0);
      }
    }
    
    // Install dependencies
    spinner.text = 'Installing dependencies...';
    await installDependencies(projectRoot, projectType);
    
    // Create configuration
    spinner.text = 'Creating configuration...';
    await createConfiguration(projectRoot, projectType);
    
    // Create test directory structure
    spinner.text = 'Setting up test structure...';
    await createTestStructure(projectRoot);
    
    // Create sample test
    spinner.text = 'Creating sample test...';
    await createSampleTest(projectRoot, projectType);
    
    // Update package.json scripts
    spinner.text = 'Updating package.json scripts...';
    await updatePackageScripts(packageJsonPath);
    
    // Create .gitignore entries
    spinner.text = 'Updating .gitignore...';
    await updateGitIgnore(projectRoot);
    
    spinner.succeed('@devin/visual-tools initialized successfully!');
    
    console.log(chalk.green('\n✨ Next steps:'));
    console.log(chalk.white('  Run: npm run test:visual'));
    console.log(chalk.white('  Or: npx devin-visual-test --watch'));
    console.log(chalk.yellow('\n📝 Configuration: devin-visual.config.ts'));
    console.log(chalk.yellow('📁 Tests: visual-tests/'));
    
  } catch (error) {
    spinner.fail('Initialization failed');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

/**
 * Run visual tests
 */
async function testCommand(options: {
  watch: boolean;
  updateSnapshots: boolean;
  ci: boolean;
  project?: string;
}) {
  const spinner = ora('Running visual tests...').start();
  
  try {
    // Build arguments for Playwright
    const args = [];
    
    if (options.watch) {
      args.push('--watch');
    }
    
    if (options.updateSnapshots) {
      args.push('--update-snapshots');
    }
    
    if (options.ci) {
      args.push('--ci');
    }
    
    if (options.project) {
      args.push('--project', options.project);
    }
    
    spinner.text = 'Launching Playwright...';
    
    // Execute Playwright with custom config
    const { spawn } = await import('child_process');
    
    // Determine the test runner
    const testRunner = options.watch ? 'playwright test --watch' : 'playwright test';
    
    const testProcess = spawn(testRunner, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        spinner.succeed('Visual tests passed!');
      } else {
        spinner.fail('Visual tests failed');
        process.exit(code);
      }
    });
    
  } catch (error) {
    spinner.fail('Failed to run tests');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

/**
 * Detect project type from package.json
 */
function detectProjectType(packageJson: any): string {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (deps.electron) {
    if (deps['vscode'] || deps['@types/vscode']) {
      return 'Electron + VS Code OSS';
    }
    return 'Electron';
  }
  
  if (deps['react'] || deps['@types/react']) {
    return 'React';
  }
  
  if (deps['vue'] || deps['@types/vue']) {
    return 'Vue';
  }
  
  if (deps['@angular/core']) {
    return 'Angular';
  }
  
  return 'Generic';
}

/**
 * Install required dependencies
 */
async function installDependencies(projectRoot: string, projectType: string): Promise<void> {
  const { execSync } = await import('child_process');
  
  const dependencies = [
    '@playwright/test',
    '@devin/visual-tools',
  ];
  
  if (projectType.includes('Electron')) {
    dependencies.push('playwright-electron');
  }
  
  try {
    execSync(`npm install --save-dev ${dependencies.join(' ')}`, {
      cwd: projectRoot,
      stdio: 'pipe'
    });
    
    // Install Playwright browsers
    execSync('npx playwright install --with-deps', {
      cwd: projectRoot,
      stdio: 'pipe'
    });
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${error}`);
  }
}

/**
 * Create configuration file
 */
async function createConfiguration(projectRoot: string, projectType: string): Promise<void> {
  const configPath = path.join(projectRoot, 'devin-visual.config.ts');
  
  const configContent = `import { defineConfig } from '@devin/visual-tools';

export default defineConfig({
  testDir: 'visual-tests/',
  viewports: ['sm', 'md', 'lg'],
  threshold: 0.05,
  maxRetries: 2,
  reportPath: 'visual-report/',
  ${projectType.includes('Electron' ? `
  electron: {
    entryPoint: './main.js',
    args: [],
  },
  ` : ''}
  diagnostics: {
    enabled: true,
    maxRepairAttempts: 3,
    analysisTimeout: 30000,
  },
  reporting: {
    formats: ['html', 'json'],
    includePerformance: true,
    includeAccessibility: true,
    generateVideo: false,
  },
});
`;
  
  await fs.writeFile(configPath, configContent);
}

/**
 * Create test directory structure
 */
async function createTestStructure(projectRoot: string): Promise<void> {
  const testDir = path.join(projectRoot, 'visual-tests');
  const baselineDir = path.join(testDir, 'baseline');
  
  await fs.ensureDir(testDir);
  await fs.ensureDir(baselineDir);
  
  // Create .gitkeep to preserve empty directories
  await fs.writeFile(path.join(baselineDir, '.gitkeep'), '');
}

/**
 * Create sample test
 */
async function createSampleTest(projectRoot: string, projectType: string): Promise<void> {
  const testPath = path.join(projectRoot, 'visual-tests', 'sample.spec.ts');
  
  let testContent = `import { devinTest } from '@devin/visual-tools';

devinTest('sample visual test', async ({ devin }) => {
  await devin.setTheme('dark');
  await devin.setViewport('lg');
  
  // Your test logic here
  await devin.expectScreenshot('sample-screenshot');
});
`;
  
  if (projectType.includes('Electron')) {
    testContent = `import { devinTest } from '@devin/visual-tools';

devinTest('Electron app main window', async ({ devin }) => {
  // Wait for app to load
  await devin.page.waitForLoadState('networkidle');
  
  // Test theme switching
  await devin.setTheme('dark');
  await devin.expectScreenshot('dark-theme');
  
  await devin.setTheme('light');
  await devin.expectScreenshot('light-theme');
  
  // Test different viewports
  await devin.setViewport('md');
  await devin.expectScreenshot('medium-viewport');
  
  await devin.setViewport('lg');
  await devin.expectScreenshot('large-viewport');
});
`;
  }
  
  await fs.writeFile(testPath, testContent);
}

/**
 * Update package.json scripts
 */
async function updatePackageScripts(packageJsonPath: string): Promise<void> {
  const packageJson = await fs.readJson(packageJsonPath);
  
  packageJson.scripts = {
    ...packageJson.scripts,
    'test:visual': 'devin-visual-test',
    'test:visual:watch': 'devin-visual-test --watch',
    'test:visual:update': 'devin-visual-test --update-snapshots',
    'test:visual:ci': 'devin-visual-test --ci',
  };
  
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

/**
 * Update .gitignore
 */
async function updateGitIgnore(projectRoot: string): Promise<void> {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  
  let gitignoreContent = '';
  
  if (await fs.pathExists(gitignorePath)) {
    gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
  }
  
  const entries = [
    '# Devin Visual Tools',
    'visual-report/',
    'visual-tests/baseline/',
    '.devin-screenshots/',
  ];
  
  for (const entry of entries) {
    if (!gitignoreContent.includes(entry.trim())) {
      gitignoreContent += `\n${entry}`;
    }
  }
  
  await fs.writeFile(gitignorePath, gitignoreContent.trim());
}

export { initCommand, testCommand };
