#!/usr/bin/env node
// jobs/queue_voice.mjs
// Batch TTS job runner with concurrency + graceful fallbacks

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// --- config (env-overridable)
const CONCURRENCY = clampInt(process.env.CONCURRENCY, os.cpus().length) || 4;
const PROMPTS_FILE = process.env.PROMPTS_FILE || '';     // e.g. data/voice/my_prompts.txt
const N = clampInt(process.env.N, 0);                    // if >0 and no file, synthesize N prompts
const OUT_DIR = process.env.OUT_DIR || 'core/voice/output/batch'; // target dir for wav
const BASE_NAME = process.env.BASE_NAME || 'tts_item';   // file name stem (tts_item_0001.wav)

// summary / stats
const startedAt = Date.now();
let okCount = 0;

// lazy import to avoid ESM path edge cases
async function getTTS() {
  const url = new URL('../core/voice/utils/tts_router.mjs', import.meta.url);
  return import(url.href);
}

// ---------- helpers
function clampInt(v, def) {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : def;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function zeroPad(n, width) {
  const s = String(n);
  return s.length >= width ? s : '0'.repeat(width - s.length) + s;
}

function readLines(p) {
  try {
    if (p && fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    }
  } catch (_) {
    // ignore; fall through to default prompts
  }
  if (N && N > 0) {
    return Array.from({ length: N }, (_, i) => `ghost ops sample ${i + 1}`);
  }
  // safe defaults if neither file nor N is provided
  return [
    'hello from aegis',
    'quick pipeline check',
    'status report',
    'beep test',
    'wrap up turn'
  ];
}

// simple pool runner
async function runPool(items, worker, concurrency) {
  const q = items.slice();
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (q.length) {
      const item = q.shift();
      try {
        await worker(item);
      } catch (e) {
        // keep going on errors
        console.error('worker error:', e?.message || e);
      }
    }
  });
  await Promise.all(workers);
}

// ---------- main
async function main() {
  const { speak } = await getTTS();

  const prompts = readLines(PROMPTS_FILE);
  ensureDir(OUT_DIR);

  let idx = 0;
  const t0 = Date.now();

  await runPool(prompts, async (text) => {
    const i = ++idx;
    const outPath = path.join(OUT_DIR, `${BASE_NAME}_${zeroPad(i, 4)}.wav`);
    const r = await speak(text, outPath);
    okCount += r?.ok ? 1 : 0;

    // minimal per-item log (one line)
    process.stdout.write(
      JSON.stringify({ i, ok: !!r?.ok, outPath: r?.outPath, text }, null, 0) + '\n'
    );
  }, CONCURRENCY);

  const ms = Date.now() - t0;
  const memMB = (process.memoryUsage().rss / (1024 * 1024)).toFixed(3);

  console.log(JSON.stringify({
    ok: true,
    total: prompts.length,
    okCount,
    ms,
    mb: memMB,
    startedAt,
    finishedAt: Date.now()
  }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err?.stack || err);
    process.exit(1);
  });
}