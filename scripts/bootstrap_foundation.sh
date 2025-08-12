cat > scripts/bootstrap_foundation.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "==> Bootstrapping AEGIS foundation…"

ROOT="$(pwd)"
mkdir -p core/voice/utils core/voice/output core/runtime core/models/store jobs tools/{audits,codemods,guards} logs docs/adr

# 1) _env.mjs (paths, no secrets)
if ! grep -q 'CORE_VOICE_OUTPUT_DIR' _env.mjs 2>/dev/null; then
  cat > _env.mjs <<'E2'
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname);
export const CORE_DIR = path.join(ROOT_DIR, 'core');
export const CORE_VOICE_DIR = path.join(CORE_DIR, 'voice');
export const CORE_VOICE_OUTPUT_DIR = path.join(CORE_VOICE_DIR, 'output');
E2
  echo " + _env.mjs written"
else
  echo " = _env.mjs exists (ok)"
fi

# 2) .env scaffolding
[ -f .env.example ] || printf "# add keys here; no secrets committed\nELEVENLABS_API_KEY=\n" > .env.example
[ -f .env ] || touch .env

# 3) package.json: ensure ESM + imports aliases
node - <<'E3'
const fs=require('fs');
const p='package.json';
const pkg=JSON.parse(fs.readFileSync(p,'utf8'));
pkg.type='module';
pkg.imports = Object.assign({
  "#core/*":"./core/*",
  "#cognition/*":"./core/cognition/*",
  "#voice/*":"./core/voice/*",
  "#voice-utils/*":"./core/voice/utils/*",
  "#tools/*":"./tools/*"
}, pkg.imports||{});
pkg.scripts = Object.assign({
  "format":"prettier -w .",
  "lint":"eslint . --ext .js,.mjs,.ts || true",
  "audit:imports":"node tools/audits/import_audit.mjs",
  "guard:invariants":"node tools/guards/invariants.mjs",
  "doctor":"node tools/doctor.mjs"
}, pkg.scripts||{});
pkg.devDependencies = Object.assign({
  "acorn":"^8.12.1",
  "acorn-walk":"^8.3.2",
  "prettier":"^3.3.3",
  "eslint":"^9.9.0",
  "husky":"^9.0.11"
}, pkg.devDependencies||{});
fs.writeFileSync(p, JSON.stringify(pkg,null,2));
console.log(" + package.json updated");
E3

# 4) .gitignore hardening
grep -qxF "logs/" .gitignore 2>/dev/null || echo "logs/" >> .gitignore
grep -qxF "core/voice/output/" .gitignore 2>/dev/null || echo "core/voice/output/" >> .gitignore
grep -qxF "data/" .gitignore 2>/dev/null || echo "data/" >> .gitignore
grep -qxF ".env" .gitignore 2>/dev/null || echo ".env" >> .gitignore
# tombstone to forbid root voice dir
[ -e voice ] || printf "tombstone: use core/voice/* only\n" > voice
grep -q '^voice$' .gitignore 2>/dev/null || echo "voice" >> .gitignore

# 5) AST-based import audit (no regex false positives)
cat > tools/audits/import_audit.mjs <<'E5'
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'acorn';
import { simple as walk } from 'acorn-walk';

const root = process.cwd();
const skip = new Set(['node_modules','.git','logs','data']);
const exts = new Set(['.mjs','.js','.ts']);
const files=[];

(function crawl(d){
  for (const e of fs.readdirSync(d,{withFileTypes:true})) {
    if (skip.has(e.name)) continue;
    const p = path.join(d,e.name);
    if (e.isDirectory()) crawl(p);
    else if (exts.has(path.extname(e.name))) files.push(p);
  }
})(root);

const bad=[], deepIntoCore=[];
for (const file of files){
  const src=fs.readFileSync(file,'utf8');
  let ast; try{ ast=parse(src,{ecmaVersion:'latest',sourceType:'module'});}catch{continue}
  walk(ast,{
    ImportDeclaration(n){check(file,n.source.value)},
    ExportAllDeclaration(n){check(file,n.source.value)}
  });
}
function check(file,spec){
  if (!spec || typeof spec!=='string') return;
  if (spec.startsWith('../') && spec.includes('/core/')) deepIntoCore.push({file,spec});
  if (!spec.startsWith('.')) return;
  const base=path.dirname(file);
  const resolved=path.resolve(base,spec);
  const candidates=['','.mjs','.js','.ts','/index.mjs','/index.js','/index.ts'].map(s=>resolved+s);
  if (!candidates.some(fs.existsSync)) bad.push({file,spec});
}

let fail=false;
if (deepIntoCore.length){
  console.error('Alias violations (use #core/* or #voice-utils/*):');
  for (const b of deepIntoCore) console.error(` - ${b.file} -> ${b.spec}`);
  fail=true;
}
if (bad.length){
  console.error('Broken relative imports:');
  for (const b of bad) console.error(` - ${b.file} -> ${b.spec}`);
  fail=true;
}
if (fail) process.exit(1);
console.log('✅ Import audit: clean');
E5
chmod +x tools/audits/import_audit.mjs

# 6) Invariants guard (self-heal & enforce)
cat > tools/guards/invariants.mjs <<'E6'
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { CORE_VOICE_DIR } from '../../_env.mjs';

let changed=false;
const ROOT = process.cwd();

const ROOT_VOICE = path.join(ROOT,'voice');
if (fs.existsSync(ROOT_VOICE) && fs.lstatSync(ROOT_VOICE).isDirectory()){
  fs.mkdirSync(CORE_VOICE_DIR,{recursive:true});
  for (const n of fs.readdirSync(ROOT_VOICE)) {
    const from=path.join(ROOT_VOICE,n);
    const to=path.join(CORE_VOICE_DIR,n);
    fs.rmSync(to,{recursive:true,force:true});
    fs.renameSync(from,to);
  }
  fs.rmSync(ROOT_VOICE,{recursive:true,force:true});
  console.error('[invariants] Healed stray ./voice -> core/voice/');
  changed=true;
}

function scanForRuntimeOutsideCore(){
  const bad=[];
  function walk(d){
    for (const e of fs.readdirSync(d,{withFileTypes:true})) {
      if (['node_modules','.git','logs','data','tools','jobs','docs'].includes(e.name)) continue;
      const p=path.join(d,e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(mjs|js|ts)$/.test(e.name) && !p.includes(path.sep+'core'+path.sep)) {
        if (!p.includes(path.sep+'scripts'+path.sep)) bad.push(p);
      }
    }
  }
  walk(ROOT);
  return bad;
}
const offenders=scanForRuntimeOutsideCore();
if (offenders.length){
  console.error('[invariants] Runtime code found outside core/:');
  offenders.forEach(p=>console.error(' - '+p));
  process.exit(2);
}

if (!changed) console.log('[invariants] OK');
E6
chmod +x tools/guards/invariants.mjs

# 7) Cron wrapper (ensures dirs + invariants before running)
cat > tools/run_with_env.mjs <<'E7'
#!/usr/bin/env node
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { CORE_VOICE_OUTPUT_DIR } from '../_env.mjs';
import '../tools/guards/invariants.mjs';

fs.mkdirSync(CORE_VOICE_OUTPUT_DIR, { recursive: true });

const [, , script, ...args] = process.argv;
if (!script){ console.error('Usage: node tools/run_with_env.mjs <script> [...args]'); process.exit(2); }
const child = spawn(process.execPath, [script, ...args], { stdio: 'inherit' });
child.on('exit', c => process.exit(c ?? 0));
E7
chmod +x tools/run_with_env.mjs

# 8) Manifest helper
cat > core/runtime/manifest.mjs <<'E8'
import fs from 'node:fs';
import path from 'node:path';

export function writeManifest(dir, manifest){
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'manifest.json'), JSON.stringify(manifest,null,2));
}
E8

# 9) Doctor
cat > tools/doctor.mjs <<'E9'
#!/usr/bin/env node
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { CORE_VOICE_OUTPUT_DIR } from '../_env.mjs';

function caps(){
  return {
    os: process.platform,
    cpuThreads: os.cpus().length,
    memGB: Math.round(os.totalmem()/1e9),
  };
}

function latestManifests(root){
  const found=[];
  function walk(d,depth=0){
    if (depth>4) return;
    for (const e of fs.readdirSync(d,{withFileTypes:true})) {
      const p=path.join(d,e.name);
      if (e.isDirectory()) walk(p,depth+1);
      else if (e.isFile() && e.name==='manifest.json') found.push(p);
    }
  }
  try { walk(root); } catch {}
  return found.slice(-5);
}

console.log('=== AEGIS Doctor ===');
console.log('Capabilities:', caps());
console.log('Voice output dir:', CORE_VOICE_OUTPUT_DIR);
console.log('Latest manifests:', latestManifests('core/voice/output'));
console.log('Invariants check:');
await import('./guards/invariants.mjs').catch(()=>{});
E9
chmod +x tools/doctor.mjs

# 10) Codemod to rewrite deep imports to aliases
cat > tools/codemods/aliases_rewrite.mjs <<'E10'
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'acorn';
import { simple as walk } from 'acorn-walk';

const exts=new Set(['.mjs','.js','.ts']);
const skip=new Set(['node_modules','.git','logs','data']);

const files=[];
(function crawl(d){
  for (const e of fs.readdirSync(d,{withFileTypes:true})) {
    if (skip.has(e.name)) continue;
    const p=path.join(d,e.name);
    if (e.isDirectory()) crawl(p);
    else if (exts.has(path.extname(e.name))) files.push(p);
  }
})(process.cwd());

let changed=0;
for (const file of files){
  const src=fs.readFileSync(file,'utf8');
  let ast; try{ ast=parse(src,{ecmaVersion:'latest',sourceType:'module'});}catch{continue}
  const edits=[];
  walk(ast,{
    ImportDeclaration(n){ edits.push({start:n.source.start,end:n.source.end}) },
    ExportAllDeclaration(n){ edits.push({start:n.source.start,end:n.source.end}) }
  });
  if (!edits.length) continue;

  let out='',last=0,mod=false;
  for (const {start,end} of edits){
    const raw = src.slice(start,end);
    const spec = raw.slice(1,-1);
    if (spec.startsWith('../') && spec.includes('/core/')) {
      let aliased = spec.replace(/.*\/core\/voice\/utils\//,'#voice-utils/')
                        .replace(/.*\/core\/voice\//,'#voice/')
                        .replace(/.*\/core\//,'#core/');
      if (aliased!==spec){
        out += src.slice(last,start) + JSON.stringify(aliased);
        last = end; mod=true;
      }
    }
  }
  if (mod){ out += src.slice(last); fs.writeFileSync(file,out,'utf8'); changed++; }
}
console.log(`Rewrote ${changed} file(s) to use aliases`);
E10
chmod +x tools/codemods/aliases_rewrite.mjs

# 11) Husky pre-commit
npm i -D >/dev/null 2>&1 || npm i -D
npx husky init >/dev/null 2>&1 || true
echo -e "npm run format\nnpm run audit:imports\nnpm run guard:invariants" > .husky/pre-commit
chmod +x .husky/pre-commit
echo " + Husky pre-commit installed"

# 12) Minimal CI
mkdir -p .github/workflows
cat > .github/workflows/ci.yml <<'E12'
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run audit:imports
      - run: npm run guard:invariants
      - run: npm run doctor
E12
echo " + CI workflow added"

# 13) First pass codemod + audits
node tools/codemods/aliases_rewrite.mjs || true
node tools/audits/import_audit.mjs || true
node tools/guards/invariants.mjs || true

echo "✅ Foundation bootstrap complete."
echo "Next: ensure cron uses:  cd $ROOT && node tools/run_with_env.mjs <script>"
EOF