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

function relToTarget(fromFile) {
  let rel = path.relative(path.dirname(fromFile), TARGET).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

const files = []; walk(REPO, files);

const IMPORT_RE = /((?:^|\n)\s*(?:import\s+[^'"]+from|import|export\s*\*\s*from)\s*)['"]([^'"]+env_guard\.mjs)['"]/g;

let changed = 0;
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  if (!text.includes('env_guard.mjs')) continue;

  const wanted = relToTarget(f);
  const fixed = text.replace(IMPORT_RE, (_, head, spec) => {
    const resolved = path.normalize(path.resolve(path.dirname(f), spec));
    return (resolved === TARGET) ? _ : `${head}'${wanted}'`;
  });

  if (fixed !== text) {
    fs.writeFileSync(f, fixed, 'utf8');
    console.log(`🔧 fixed: ${path.relative(REPO, f)}  →  '${wanted}'`);
    changed++;
  }
}

console.log(`\n✨ done. updated ${changed} file(s).`);
