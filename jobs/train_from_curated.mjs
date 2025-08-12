#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const LOCK_DIR = '.runlocks';
const LOCK = path.join(LOCK_DIR, 'train.lock');
const MANIFEST = 'dataset/voice_manifest.jsonl';
const MODELS_DIR = process.env.MODELS_DIR || 'models/aegis-local';
const TRAIN_SH = process.env.TRAIN_SH || 'core/voice/train/run_local_trainer.sh'; // optional user-provided
const MIN_SAMPLES = Number(process.env.MIN_SAMPLES || 20);

fs.mkdirSync(LOCK_DIR, { recursive: true });
if (fs.existsSync(LOCK)) {
  console.error('⚠ train: already running (lock present).');
  process.exit(0);
}
fs.writeFileSync(LOCK, String(process.pid));
const cleanup = () => { try { fs.rmSync(LOCK, { force: true }); } catch {} };
process.on('exit', cleanup);
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

if (!fs.existsSync(MANIFEST)) {
  console.error('✖ manifest not found:', MANIFEST);
  process.exit(2);
}
const sampleCount = fs.readFileSync(MANIFEST, 'utf8').trim().split('\n').filter(Boolean).length;
if (sampleCount < MIN_SAMPLES) {
  console.error(`⚠ not enough samples (${sampleCount} < ${MIN_SAMPLES}); skipping train.`);
  process.exit(0);
}

fs.mkdirSync(MODELS_DIR, { recursive: true });

if (fs.existsSync(TRAIN_SH)) {
  console.log('🚀 launching trainer:', TRAIN_SH);
  const r = spawnSync('bash', [TRAIN_SH], {
    stdio: 'inherit',
    env: { ...process.env, MANIFEST, MODELS_DIR }
  });
  if (r.status !== 0) {
    console.error('✖ trainer exited with', r.status);
    process.exit(r.status || 1);
  }
  console.log('✅ training complete via script.');
} else {
  // Mock: drop a checkpoint json to prove the hook flows end-to-end.
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const ckpt = path.join(MODELS_DIR, `ckpt_${stamp}.json`);
  const meta = {
    created: new Date().toISOString(),
    manifest: MANIFEST,
    samples: sampleCount,
    note: 'Mock checkpoint (no trainer script found). Provide core/voice/train/run_local_trainer.sh to enable real training.'
  };
  fs.writeFileSync(ckpt, JSON.stringify(meta, null, 2));
  console.log('🧪 mock checkpoint:', ckpt);
  console.log('ℹ️  Place a real trainer at core/voice/train/run_local_trainer.sh to enable actual training.');
}

process.exit(0);
