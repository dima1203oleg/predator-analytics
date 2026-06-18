#!/usr/bin/env node
/**
 * Standalone init command for npx @devin/visual-tools init
 */

import { initCommand } from './index';
import { Command } from 'commander';

const program = new Command();

program
  .name('devin-visual-init')
  .description('Initialize visual testing in your project')
  .option('-f, --force', 'Force re-initialization', false)
  .action(async (options) => {
    await initCommand(options);
  });

program.parse(process.argv);
