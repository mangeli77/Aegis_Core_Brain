#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const CANDIDATE_DIRS = [
  path.join(ROOT, 'voice', 'output'),                // batch_* folders
  path.join(ROOT, 'voice', 'output', 'variation_tests'),
];

// Accept only these patterns
const ACCEPT = [
  /voice\/output\/batch_[^/]+\/sample_.*\.mp3$/i,
  /voice\/output\/variation_tests\/.*\.mp3$/i,
];

// Exclude obvious test artifacts
const EXCLUDE = [
  /el_test\.mp3$/i,
  /syscheck_el\.mp3$/i,
  /test_router\.mp3$/i,
];

const MIN_BYTES = 20 * 1024;    // ≥ 20 KB
const MIN_SEC   = 3.5;          // ≥ 3.5 seconds

function walk(dir, out) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.isFile() && full.toLowerCase().endsWith('.mp3')) out.push(full);
  }
}

function matchAny(reList, s) { return reList.some((re) => re.test(s)); }

function ffprobeDurationSec(file) {
  const p = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=nk=1:nw=1',
    file,
  ], { encoding: 'utf8' });
  if (p.status !== 0) return -1;
  const v = parseFloat(String(p.stdout).trim());
  return Number.isFinite(v) ? v : -1;
}

(function main() {
  const found = [];
  for (const d of CANDIDATE_DIRS) walk(d, found);

  // Prefer batch_* first
  found.sort((a, b) => {
    const ba = /\/batch_/.test(a) ? 0 : 1;
    const bb = /\/batch_/.test(b) ? 0 : 1;
    return ba - bb || a.localeCompare(b);
  });

  const seenBase = new Set();
  for (const f of found) {
    if (!matchAny(ACCEPT, f)) continue;
    if (matchAny(EXCLUDE, f)) continue;

    let stat;
    try { stat = fs.statSync(f); } catch { continue; }
    if (!stat || stat.size < MIN_BYTES) continue;

    const dur = ffprobeDurationSec(f);
    if (dur < MIN_SEC) continue;

    const base = path.basename(f);
    if (seenBase.has(base)) continue;
    seenBase.add(base);

    console.log(f);
  }
})();