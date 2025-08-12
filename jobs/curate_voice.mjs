#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function safeMkdir(p) { fs.mkdirSync(p, { recursive: true }); }

function* readJsonl(p) {
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean);
  for (const line of lines) yield JSON.parse(line);
}

function moveWithSidecar(srcWav, dstDir) {
  safeMkdir(dstDir);
  const base = path.basename(srcWav, '.wav');
  const dstWav = path.join(dstDir, base + '.wav');
  const srcMeta = srcWav.replace(/\.wav$/i, '.meta.json');
  const dstMeta = path.join(dstDir, base + '.meta.json');

  fs.copyFileSync(srcWav, dstWav);
  if (fs.existsSync(srcMeta)) fs.copyFileSync(srcMeta, dstMeta);
}

async function main() {
  const SCORE_JSONL = process.argv[2]; // from score_batch
  const TRAIN_DIR = process.argv[3] || 'core/voice/output/train/high_confidence';
  const REJECT_DIR = process.argv[4] || 'core/voice/output/train/rejects';

  if (!SCORE_JSONL || !fs.existsSync(SCORE_JSONL)) {
    console.error('Missing score jsonl');
    process.exit(2);
  }
  let kept = 0, rejected = 0;
  for (const row of readJsonl(SCORE_JSONL)) {
    if (!row?.wav) continue;
    if (row.pass) {
      moveWithSidecar(row.wav, TRAIN_DIR);
      kept++;
    } else {
      moveWithSidecar(row.wav, REJECT_DIR);
      rejected++;
    }
  }
  console.log(JSON.stringify({ ok:true, kept, rejected, TRAIN_DIR, REJECT_DIR }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e); process.exit(1); });
}