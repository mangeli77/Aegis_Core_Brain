import fs from 'node:fs';
import path from 'node:path';

const exts = ['.mjs', '.js', '.cjs', '.ts', '.tsx', '/index.mjs', '/index.js'];

function resolvePath(from, spec) {
  // Only check relative paths or core/ imports
  if (!spec.startsWith('.') && !spec.startsWith('core/')) return null;

  const base = spec.startsWith('.')
    ? path.resolve(path.dirname(from), spec)
    : path.resolve(process.cwd(), spec); // treat core/ as from repo root

  // Try file as-given + extensions + index files
  const candidates = [base, ...exts.map(e => base + e)];
  for (const c of candidates) {
    if (fs.existsSync(c)) return null; // valid match found
  }
  return candidates; // no matches
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.(mjs|js|cjs|ts|tsx)$/.test(entry.name)) yield p;
  }
}

const problems = [];
for (const file of walk(process.cwd())) {
  const src = fs.readFileSync(file, 'utf8');
  const specs = [
    ...src.matchAll(/import\s+[^'"]*['"]([^'"]+)['"]/g),
    ...src.matchAll(/from\s+['"]([^'"]+)['"]/g),
    ...src.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map(m => m[1]);

  for (const s of specs) {
    const bad = resolvePath(file, s);
    if (bad) problems.push({ file, spec: s, tried: bad });
  }
}

if (problems.length === 0) {
  console.log('✔ All local/core imports resolve.');
  process.exit(0);
} else {
  console.log('✖ Unresolved imports:');
  for (const p of problems) {
    console.log(`- ${p.file}\n    → '${p.spec}' (tried: ${p.tried.join(', ')})`);
  }
  process.exit(1);
}