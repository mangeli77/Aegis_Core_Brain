#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const CURATED_DIR = process.env.CURATED_DIR || 'core/voice/output/train/high_confidence';
const OUT_DIR = 'dataset';
const MANIFEST = path.join(OUT_DIR, 'voice_manifest.jsonl');

fs.mkdirSync(OUT_DIR, { recursive: true });

function findTextSidecar(wavPath) {
  const base = wavPath.replace(/\.wav$/i, '');
  const metaJson = base + '.meta.json';
  const txt = base + '.txt';

  if (fs.existsSync(metaJson)) {
    try {
      const m = JSON.parse(fs.readFileSync(metaJson, 'utf8'));
      if (m?.text && String(m.text).trim()) return String(m.text).trim();
    } catch {}
  }
  if (fs.existsSync(txt)) {
    try {
      const t = fs.readFileSync(txt, 'utf8').trim();
      if (t) return t;
    } catch {}
  }
  // fallback: filename tokens
  return path.basename(base).replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function listWavs(dir) {
  if (!fs.existsSync(dir)) return [];
  const items = fs.readdirSync(dir);
  const out = [];
  for (const it of items) {
    const p = path.join(dir, it);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...listWavs(p));
    else if (p.toLowerCase().endsWith('.wav')) out.push(p);
  }
  return out;
}

const wavs = listWavs(CURATED_DIR);
if (!wavs.length) {
  console.error('✖ No curated wavs found in', CURATED_DIR);
  process.exit(2);
}

const fh = fs.openSync(MANIFEST, 'w');
let wrote = 0;
for (const wav of wavs) {
  const text = findTextSidecar(wav);
  const rec = { audio: wav, text };
  fs.writeSync(fh, JSON.stringify(rec) + '\n');
  wrote++;
}
fs.closeSync(fh);

console.log('📝 manifest:', MANIFEST);
console.log('   samples:', wrote);
process.exit(0);
