#!/usr/bin/env node
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const BATCH_DIR = 'core/voice/output/batch';
const SCORE_DIR = 'logs/voice/score';

function run(cmd, args = [], env = {}) {
  console.log('▸', cmd, args.join(' '));
  const r = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.status !== 0) { console.error(`✖ ${cmd} failed (${r.status})`); process.exit(r.status || 1); }
}

function hasWavs(dir) {
  try { return existsSync(dir) && readdirSync(dir).some(f => f.toLowerCase().endsWith('.wav')); }
  catch { return false; }
}

function newestJsonl(dir) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter(f => f.endsWith('.jsonl'));
  if (!files.length) return null;
  const sorted = files
    .map(f => ({ f, t: statSync(join(dir,f)).mtimeMs }))
    .sort((a,b)=>b.t-a.t);
  return join(dir, sorted[0].f);
}

(function main() {
  // 1) Ensure a batch exists
  if (!hasWavs(BATCH_DIR)) {
    const N = String(process.env.N || 30);
    const CONCURRENCY = String(process.env.CONCURRENCY || 4);
    console.log(`➕ enqueueing batch N=${N} CONCURRENCY=${CONCURRENCY}`);
    run('node', ['jobs/queue_voice.mjs'], { N, CONCURRENCY });
  } else {
    console.log('✓ batch present:', BATCH_DIR);
  }

  // 2) Score to timestamped JSONL
  const SCORE_OUT = join(SCORE_DIR, `score_${Date.now()}.jsonl`);
  run('node', ['jobs/score_batch.mjs', BATCH_DIR, SCORE_DIR], { SCORE_OUT });

  // 3) Curate newest score file
  const latest = newestJsonl(SCORE_DIR);
  if (!latest) { console.error('✖ no score jsonl found'); process.exit(1); }
  console.log('🗂  curating:', latest);
  run('node', ['jobs/curate_voice.mjs', latest]);

  // 4) Build manifest from curated set
  run('node', ['tools/dataset/build_manifest.mjs']);

  // 5) Kick off local training (mock if no trainer script)
  run('node', ['jobs/train_from_curated.mjs']);

  console.log('✅ auto voice loop + train complete.');
})();
