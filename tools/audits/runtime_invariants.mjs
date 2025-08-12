#!/usr/bin/env node
import fs from 'node:fs';
const required = [
  'core/runtime/capabilities.mjs',
  'core/runtime/modelRegistry.mjs',
  'core/runtime/router.mjs',
  'core/runtime/scheduler.mjs',
  'core/runtime/manifest.mjs',
  'jobs/smoke_runtime.mjs'
];
const missing = required.filter(p=>!fs.existsSync(p));
if (missing.length){ console.error('Broken runtime spine:\n - '+missing.join('\n - ')); process.exit(2); }
console.log('✅ Runtime spine OK.');
