// Prepares dist/ before NestJS build/start:
// 1. Deletes dist/ (since deleteOutDir is disabled in nest-cli.json)
// 2. Copies Prisma pre-compiled files (e.g. index.js) to dist/generated/
//    so they are available alongside the TypeScript-compiled output.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const distGenerated = path.join(distDir, 'generated');
const srcGenerated = path.join(root, 'generated');

// 1. Clean dist/
try {
  fs.rmSync(distDir, { recursive: true });
} catch (err) {
  if (err.code !== 'ENOENT') {
    console.error('[prepare] Failed to clean dist/:', err.message);
    process.exit(1);
  }
}

// 2. Copy generated/ → dist/generated/
try {
  fs.mkdirSync(distGenerated, { recursive: true });
  fs.cpSync(srcGenerated, distGenerated, { recursive: true, force: true });
} catch (err) {
  console.error('[prepare] Failed to copy generated/:', err.message);
  process.exit(1);
}

console.log('[prepare] dist cleaned and generated/ copied to dist/generated/');
