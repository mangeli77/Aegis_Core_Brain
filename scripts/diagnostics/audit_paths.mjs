// scripts/diagnostics/audit_paths.mjs
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = process.cwd();
const START = Date.now();

// Directories to ignore entirely
const IGNORE_DIRS = new Set([
  'node_modules',
  '_attic',
  '.git',
  'logs',
  '.cache',
  '.vscode',
  '.idea',
  'dist',
  'build',
  '.DS_Store',
  // large/foreign envs
  'data/voice/tts-env',
  'data/.venv',
  'venv',
]);

// File globs to scan
const EXTENSIONS = new Set(['.mjs', '.js', '.ts']);

// Simple import regex (handles import ... from 'x' and dynamic import('x'))
const IMPORT_RE = /\bimport(?:\s+[\w*\s{},]+)?\s*from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function shouldIgnore(fullPath) {
  const rel = path.relative(ROOT, fullPath).replaceAll('\\', '/');
  // Don't ignore the repo root
  if (rel === '') return false;
  if (rel.startsWith('..')) return true;

  const parts = rel.split('/');
  for (const seg of parts) {
    if (IGNORE_DIRS.has(seg)) return true;
  }
  return false;
}

function walk(dir, files = []) {
  if (shouldIgnore(dir)) return files;
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return files; }
  for (const ent of ents) {
    const p = path.join(dir, ent.name);
    if (shouldIgnore(p)) continue;
    if (ent.isDirectory()) {
      walk(p, files);
    } else {
      const ext = path.extname(ent.name).toLowerCase();
      if (EXTENSIONS.has(ext)) files.push(p);
    }
  }
  return files;
}

function resolveImport(fromFile, spec) {
  // Only care about relative specs (./ or ../). Skip bare module imports.
  if (!spec.startsWith('./') && !spec.startsWith('../')) return null;

  const base = path.dirname(fromFile);

  // Try as-is
  let candidate = path.resolve(base, spec);
  const tried = [];

  const tryFile = (p) => {
    tried.push(p);
    return fs.existsSync(p) ? p : null;
  };

  // Exact file hit
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;

  // With extensions
  for (const ext of ['', '.mjs', '.js', '.ts']) {
    const p = candidate + ext;
    const hit = tryFile(p);
    if (hit) return hit;
  }

  // Index resolution for directories
  const asDir = candidate;
  if (fs.existsSync(asDir) && fs.statSync(asDir).isDirectory()) {
    for (const ix of ['index.mjs', 'index.js', 'index.ts']) {
      const p = path.join(asDir, ix);
      const hit = tryFile(p);
      if (hit) return hit;
    }
  }

  return { missing: true, tried };
}

function nowIso() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

const files = walk(ROOT, []);
const broken = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf-8');
  let m;
  while ((m = IMPORT_RE.exec(src))) {
    const spec = (m[1] || m[2] || '').trim();
    if (!spec) continue;

    const res = resolveImport(file, spec);
    if (res && typeof res === 'object' && res.missing) {
      broken.push({ file, spec });
    }
  }
}

const report =
  `Path Audit @ ${new Date().toISOString()}\n` +
  `Root: ${ROOT}\n` +
  `Scanned files: ${files.length}\n` +
  `Broken imports: ${broken.length}\n\n` +
  broken.map(b =>
    `❌ MISSING IMPORT\n   In: ${path.relative(ROOT, b.file)}\n   Spec: ${b.spec}\n   Suggestions: (none)\n`
  ).join('\n');

const outDir = path.join(ROOT, 'logs', 'diagnostics');
ensureDir(outDir);
const outFile = path.join(outDir, `path_audit_${nowIso()}.log`);
fs.writeFileSync(outFile, report, 'utf-8');

console.log(report);
console.log(`📝 Saved detailed report to: ${outFile}`);