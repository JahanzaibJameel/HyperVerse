#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';

// Ensure we're in the project root
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

console.log('🎨 Starting Storybook for design system development...');
console.log('📁 Project root:', projectRoot);

try {
  // Start Storybook for React Native
  execSync('npx storybook dev --port 6006', {
    stdio: 'inherit',
    cwd: projectRoot,
  });

  console.log('✨ Storybook started at http://localhost:6006');
  console.log('🎯 Focus: Design system development and component testing');
} catch (error: any) {
  console.error('❌ Failed to start Storybook:', error.message);
  process.exit(1);
}
