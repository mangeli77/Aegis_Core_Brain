import fs from 'node:fs';
import path from 'node:path';

const REPO = process.cwd();
const TARGET = path.resolve(REPO, 'core/voice/utils/env_guard.mjs');

const EXCLUDE_DIRS = new Set(['node_modules','.git','logs','core/cognition/learning/voice/raw_scripts']);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(m?js|cjs|ts|tsx)$/.test(e.name)) out.push(p);
  }
}

const files = []; walk(REPO, files);

const bad = [];
const IMPORT_RE = /(?:^|\n)\s*(?:import\s+[^'"]+from|import|export\s*\*\s*from)\s*['"]([^'"]+env_guard\.mjs)['"]/g;

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = IMPORT_RE.exec(text))) {
    const spec = m[1];
    // Only relative/bare we care about
    if (!spec.startsWith('.') && !spec.startsWith('/')) {
      bad.push({ file: f, import: spec, reason: 'non-relative import' });
      continue;
    }
    const resolved = path.normalize(path.resolve(path.dirname(f), spec));
    if (resolved !== TARGET) {
      bad.push({ file: f, import: spec, reason: `resolves to ${path.relative(REPO, resolved)}` });
    }
  }
}

if (bad.length) {
  console.log('❌ Bad env_guard.mjs imports:\n');
  for (const b of bad) {
    console.log(`${path.relative(REPO, b.file)}: '${b.import}'  ->  ${b.reason}`);
  }
  process.exitCode = 1;
} else {
  console.log('✅ All env_guard.mjs imports resolve to core/voice/utils/env_guard.mjs');
}
