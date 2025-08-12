#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.."; pwd)"
cd "$REPO_ROOT"

echo "==> Repo: $REPO_ROOT"

mkdir -p tools/guards tools/audits tools/codemods core/core/voice/output logs

# 1) Ensure _env.mjs has canonical voice paths
if ! grep -q 'export const CORE_VOICE_DIR' _env.mjs 2>/dev/null; then
  cat >> _env.mjs <<'EOF'

// --- Aegis voice path exports (added by install_voice_path_hardening.sh)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = typeof ROOT_DIR !== 'undefined' ? ROOT_DIR : path.resolve(__dirname);
export const CORE_DIR = path.join(ROOT_DIR, 'core');
export const CORE_VOICE_DIR = path.join(CORE_DIR, 'voice');
export const CORE_VOICE_OUTPUT_DIR = path.join(CORE_VOICE_DIR, 'output');
EOF
  echo "   + Appended CORE_VOICE_* exports to _env.mjs"
else
  echo "   = _env.mjs already defines CORE_VOICE_*"
fi

# 2) Guard: moves stray ./voice into core/voice and flags it
cat > tools/guards/voice_guard.mjs <<'EOF'
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { CORE_VOICE_DIR } from '../../_env.mjs';

const ROOT_VOICE_DIR = path.join(process.cwd(), 'voice');
try {
  if (fs.existsSync(ROOT_VOICE_DIR) && fs.lstatSync(ROOT_VOICE_DIR).isDirectory()) {
    fs.mkdirSync(CORE_VOICE_DIR, { recursive: true });
    for (const name of fs.readdirSync(ROOT_VOICE_DIR)) {
      const from = path.join(ROOT_VOICE_DIR, name);
      const to = path.join(CORE_VOICE_DIR, name);
      fs.rmSync(to, { recursive: true, force: true });
      fs.renameSync(from, to);
    }
    fs.rmSync(ROOT_VOICE_DIR, { recursive: true, force: true });
    console.error('[voice_guard] Moved stray ./voice/ into core/voice/.');
    process.exitCode = 1;
  }
} catch (err) {
  console.error('[voice_guard] Error:', err);
  process.exit(2);
}
EOF
chmod +x tools/guards/voice_guard.mjs
echo "   + Tools guard written"

# 3) Wrapper: normalize env, make output dir, auto-heal, then run target script
cat > tools/run_with_env.mjs <<'EOF'
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { CORE_VOICE_DIR, CORE_VOICE_OUTPUT_DIR } from '../_env.mjs';

fs.mkdirSync(CORE_VOICE_OUTPUT_DIR, { recursive: true });

const ROOT_VOICE = path.join(process.cwd(), 'voice');
if (fs.existsSync(ROOT_VOICE) && fs.lstatSync(ROOT_VOICE).isDirectory()) {
  for (const name of fs.readdirSync(ROOT_VOICE)) {
    const from = path.join(ROOT_VOICE, name);
    const to = path.join(CORE_VOICE_DIR, name);
    fs.rmSync(to, { recursive: true, force: true });
    fs.renameSync(from, to);
  }
  fs.rmSync(ROOT_VOICE, { recursive: true, force: true });
  console.error('[run_with_env] Healed stray ./voice/ -> core/voice/');
}

const [, , script, ...args] = process.argv;
if (!script) {
  console.error('Usage: node tools/run_with_env.mjs <script> [...args]');
  process.exit(2);
}
const child = spawn(process.execPath, [script, ...args], { stdio: 'inherit' });
child.on('exit', code => process.exit(code ?? 0));
EOF
chmod +x tools/run_with_env.mjs
echo "   + Env wrapper written"

# 4) Import audit: find broken relative imports
cat > tools/audits/import_audit.mjs <<'EOF'
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const bad = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'logs', '_attic'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(mjs|js|ts)$/.test(e.name)) auditFile(p);
  }
}

function auditFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[1];
    if (spec.startsWith('http') || spec.startsWith('node:') || /^[a-zA-Z@]/.test(spec)) continue;
    const base = path.dirname(file);
    const resolved = path.resolve(base, spec);
    const candidates = ['', '.mjs', '.js', '.ts', '/index.mjs', '/index.js', '/index.ts'].map(s => resolved + s);
    if (!candidates.some(c => fs.existsSync(c))) bad.push({ file, spec });
  }
}

walk(root);
if (bad.length) {
  console.error('Broken relative imports:\n' + bad.map(({file,spec}) => ` - ${file} -> ${spec}`).join('\n'));
  process.exit(1);
} else {
  console.log('✅ No broken relative imports found.');
}
EOF
chmod +x tools/audits/import_audit.mjs
echo "   + Import audit written"

# 5) Tombstone to block accidental ./voice dir creation
if [ ! -e voice ]; then
  printf "Tombstone: use core/voice/ only.\n" > voice
  echo "   + Tombstone file created at ./voice"
fi
if ! grep -q '^/voice/$' .gitignore 2>/dev/null; then
  {
    echo "/voice/"
    echo "!voice"
  } >> .gitignore
  echo "   + .gitignore updated to allow tombstone but block /voice/ dir"
fi

# 6) Optional: update cron to call the wrapper (commented; print snippet instead)
echo
echo "==> Add these to crontab (crontab -e), adjust path if needed:"
echo "*/15 * * * * cd $REPO_ROOT && /usr/bin/env node tools/run_with_env.mjs core/cognition/loops/voice_cognition_core.mjs >> logs/cron.voice.log 2>&1"
echo "0 * * * *   cd $REPO_ROOT && /usr/bin/env node tools/run_with_env.mjs core/cognition/loops/run_voice_crossover_pipeline.mjs >> logs/cron.crossover.log 2>&1"

# 7) Run guard once & audit
node tools/guards/voice_guard.mjs || true
node tools/audits/import_audit.mjs || true

echo
echo "✅ Voice path hardening installed."