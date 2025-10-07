#!/usr/bin/env node
import { copyFileSync } from 'fs';
import { join } from 'path';

// Copy index.html to 404.html for GitHub Pages SPA support
const buildDir = 'build';
const indexPath = join(buildDir, 'index.html');
const notFoundPath = join(buildDir, '404.html');

try {
  copyFileSync(indexPath, notFoundPath);
  console.log('✅ Created 404.html for GitHub Pages SPA support');
} catch (error) {
  console.error('❌ Failed to create 404.html:', error.message);
  process.exit(1);
}
