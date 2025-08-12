#!/usr/bin/env node
/**
 * Deprecation scanner (dry-run by default).
 * - Finds candidate scripts not referenced by other files or package.json.
 * - Safe mode: just prints. Use `--apply` to move to _attic/.
 *
 * Usage:
 *   node scripts/maintenance/deprecate_scan.mjs         # dry run
 *   node scripts/maintenance/deprecate_scan.mjs --apply # move to attic
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const REPO = process.cwd();
const ATTIC = path.join(REPO, "_attic", `deprecated_${new Date().toISOString().slice(0,10)}`);
const APPLY = process.argv.includes("--apply");

// Globs we care about
const exts = new Set([".mjs", ".js", ".sh"]);
const ignoreDirs = new Set([
  "node_modules", ".git", "_attic", ".vscode", ".idea", "logs",
  "core/voice/output", "voice/wav_training", "dist", "build"
]);

// Files we always keep (critical entrypoints)
const KEEP = new Set([
  "package.json",
  "_env.mjs",
  "scripts/diagnostics/run_doctor.sh",
  "scripts/diagnostics/full_voice_pipeline_check.sh",
  "scripts/diagnostics/audit_paths.mjs",
  "scripts/diagnostics/doctor_voice.mjs",
  "scripts/patches/train_jarvis.sh",
  "scripts/maintenance/generate_voice_training_loop.mjs",
  "scripts/maintenance/transcribe_variation_files.mjs",
  "scripts/maintenance/voice_variations/synthesize_variation_batches.mjs",
  "scripts/test/tts_router_smoke.mjs",
  "scripts/test/test_api_keys.mjs",
  "scripts/test/test_ollama.mjs",
  "core/cognition/loops/voice_cognition_core.mjs",
  "core/cognition/loops/run_voice_crossover_pipeline.mjs",
  "voice/utils/tts_router.mjs",
  "voice/utils/elevenlabs_tts.mjs",
  "voice/utils/local_tts.mjs",
  "voice/utils/whisper_transcriber.mjs",
  "voice/utils/env_guard.mjs"
].map(p => path.normalize(p)));

const allFiles = [];
const importsMap = new Map(); // file -> Set(importSpecs)
const reverseRefs = new Map(); // target -> Set(referrers)
let pkgScriptsRefs = new Set();

// ---- helpers
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const rel = path.relative(REPO, p);
    const st = fs.lstatSync(p);
    if (st.isDirectory()) {
      if (ignoreDirs.has(name)) continue;
      walk(p);
    } else {
      if (!exts.has(path.extname(name))) continue;
      allFiles.push(rel);
    }
  }
}

function parseImports(content) {
  const specs = new Set();
  const importRe = /import\s+(?:.+?\s+from\s+)?["'](.+?)["'];?/g;
  const requireRe = /require\(["'](.+?)["']\)/g;
  const shRe = /\b(?:bash|sh)\s+([^\s;]+)\b/g;
  for (const re of [importRe, requireRe, shRe]) {
    let m;
    while ((m = re.exec(content))) specs.add(m[1]);
  }
  return specs;
}

function resolveLocal(fromFile, spec) {
  // Only handle relative specs here
  if (!spec.startsWith(".")) return null;
  const base = path.dirname(path.join(REPO, fromFile));
  const tryList = [
    spec,
    spec + ".mjs",
    spec + ".js",
    path.join(spec, "index.mjs"),
    path.join(spec, "index.js")
  ].map(s => path.normalize(path.resolve(base, s)));
  for (const abs of tryList) {
    if (fs.existsSync(abs)) return path.relative(REPO, abs);
  }
  return null;
}

function loadPkgScriptsRefs() {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO, "package.json"), "utf-8"));
  const refs = new Set();
  if (pkg?.scripts) {
    for (const key of Object.keys(pkg.scripts)) {
      const val = pkg.scripts[key];
      // naive pick: any word-looking path to our scripts
      const m = val.matchAll(/\b(?:node|bash|sh)\s+([^\s;&|]+)/g);
      for (const mm of m) {
        const spec = mm[1];
        // Normalize possible leading ./ etc.
        let candidate = spec.startsWith("./") ? spec.slice(2) : spec;
        candidate = candidate.replace(/^["']|["']$/g, "");
        if (fs.existsSync(path.join(REPO, candidate))) refs.add(path.normalize(candidate));
      }
    }
  }
  return refs;
}

// ---- build graph
walk(REPO);
pkgScriptsRefs = loadPkgScriptsRefs();

for (const rel of allFiles) {
  const abs = path.join(REPO, rel);
  const content = fs.readFileSync(abs, "utf-8");
  const specs = parseImports(content);
  importsMap.set(rel, specs);
  for (const spec of specs) {
    const target = resolveLocal(rel, spec);
    if (target) {
      if (!reverseRefs.has(target)) reverseRefs.set(target, new Set());
      reverseRefs.get(target).add(rel);
    }
  }
}

// ---- find orphans/candidates
const candidates = [];
for (const rel of allFiles) {
  const norm = path.normalize(rel);
  if (KEEP.has(norm)) continue;                // explicit keep
  if (pkgScriptsRefs.has(norm)) continue;      // referenced by package.json
  const refs = reverseRefs.get(norm);
  if (!refs || refs.size === 0) {
    // Not referenced by any other script — candidate for deprecation
    candidates.push(norm);
  }
}

// Rank candidates: obvious legacy buckets to top
function rankScore(p) {
  if (p.startsWith("scripts/patches/Phase_Zero_")) return 0;
  if (p.startsWith("scripts/patches/")) return 1;
  if (p.includes("prototype") || p.includes("legacy")) return 2;
  if (p.startsWith("scripts/maintenance/")) return 3;
  return 4;
}
candidates.sort((a,b)=> rankScore(a)-rankScore(b) || a.localeCompare(b));

// ---- report
console.log(`\nDeprecation Audit @ ${new Date().toISOString()}`);
console.log(`Scanned: ${allFiles.length} files`);
console.log(`Referenced by package.json scripts: ${pkgScriptsRefs.size}`);
console.log(`Candidates: ${candidates.length}\n`);

for (const c of candidates) {
  const size = fs.statSync(path.join(REPO, c)).size;
  const hash = crypto.createHash("md5").update(fs.readFileSync(path.join(REPO, c))).digest("hex").slice(0,8);
  console.log(`• ${c}  (${(size/1024).toFixed(1)} KB, ${hash})`);
}

if (!APPLY) {
  console.log(`\n(dry-run) Nothing moved. Re-run with --apply to move candidates to: ${path.relative(REPO, ATTIC)}\n`);
  process.exit(0);
}

// ---- apply: move to attic (preserve tree)
await fsp.mkdir(ATTIC, { recursive: true });
for (const c of candidates) {
  const src = path.join(REPO, c);
  const dst = path.join(ATTIC, c);
  await fsp.mkdir(path.dirname(dst), { recursive: true });
  await fsp.rename(src, dst);
  console.log(`↪ moved: ${c}  →  ${path.relative(REPO, dst)}`);
}

console.log(`\n✅ Moved ${candidates.length} files to ${path.relative(REPO, ATTIC)}\n`);