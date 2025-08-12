#!/usr/bin/env node
// jobs/voice_turn.mjs
import fs from 'node:fs';
import path from 'node:path';

// ---------- tiny utils ----------
const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'core/voice/output');
const LOG_DIR = path.join(ROOT, 'logs/turns');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

const nowISO = () => new Date().toISOString();
const hrtimeMs = () => Number(process.hrtime.bigint() / 1000000n);

// Robust loader that tolerates default/named exports or function module
async function loadCallable(modPath, candidates = []) {
  const m = await import(modPath);
  if (typeof m === 'function') return m;
  if (typeof m.default === 'function') return m.default;
  for (const name of candidates) {
    if (typeof m[name] === 'function') return m[name];
  }
  throw new Error(
    `Module ${modPath} has no callable export (saw keys: ${Object.keys(m)})`
  );
}

// ---------- configuration ----------
const TEXT         = process.argv[2] ?? 'ghost ops';
const BASENAME     = process.env.BASENAME || 'ghost_ops';
const TRANSCRIBER  = (process.env.TRANSCRIBER || 'noop').toLowerCase(); // 'noop' | 'whisper'
const TTS_ROUTER   = path.join(ROOT, 'core/voice/utils/tts_router.mjs');
const NOOP_ASR     = path.join(ROOT, 'core/voice/utils/noop_transcriber.mjs');
const WHISPER_ASR  = path.join(ROOT, 'core/voice/utils/whisper_transcriber.mjs');

const ts     = nowISO().replace(/[:.]/g, '-');
const outWav = path.join(OUT_DIR, `${BASENAME}.wav`);
const outMeta = outWav.replace(/\.wav$/i, '.meta.json');
const turnLog = path.join(LOG_DIR, `turn-${ts}.json`);

// ---------- tts -> wav (via router) ----------
async function synthesize(text, wavPath, metaPath) {
  const speak = await loadCallable(TTS_ROUTER, ['speak']);
  const t0 = hrtimeMs();
  const r = await speak(text, wavPath);
  const t1 = hrtimeMs();

  // Ensure meta JSON exists (router usually writes it; we backfill just in case)
  if (!fs.existsSync(metaPath)) {
    const meta = r?.meta ?? {
      text, sampleRate: 16000, ms: 1000, type: 'beep', created: nowISO()
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  }
  return {
    ok: true,
    outPath: wavPath,
    metaPath,
    elapsed_ms: t1 - t0,
    router_result: r ?? null
  };
}

// ---------- wav -> text (transcriber) ----------
async function runASR(wavPath, metaPath) {
  const modPath = TRANSCRIBER === 'whisper' ? WHISPER_ASR : NOOP_ASR;
  const transcribe = await loadCallable(modPath, ['transcribe']);

  const t0 = hrtimeMs();
  const r = await transcribe(wavPath, metaPath);
  const t1 = hrtimeMs();

  return {
    ok: !!r?.ok || true,
    text: r?.text ?? '',
    source: r?.source ?? (TRANSCRIBER === 'whisper' ? 'whisper' : 'meta|rms'),
    elapsed_ms: t1 - t0,
    raw: r
  };
}

// ---------- main ----------
async function main() {
  const started = nowISO();

  const synth = await synthesize(TEXT, outWav, outMeta);
  const asr   = await runASR(outWav, outMeta);

  const turn = {
    started,
    finished: nowISO(),
    input: { prompt: TEXT },
    tts: {
      outPath: synth.outPath,
      metaPath: synth.metaPath,
      elapsed_ms: synth.elapsed_ms,
      router_result: synth.router_result
    },
    asr: {
      text: asr.text,
      source: asr.source,
      elapsed_ms: asr.elapsed_ms
    },
    env: {
      TRANSCRIBER,
      PID: process.pid,
      cwd: ROOT
    }
  };

  fs.writeFileSync(turnLog, JSON.stringify(turn, null, 2));
  console.log(JSON.stringify({ ok: true, turnLog, text: asr.text }, null, 2));
}

main().catch(e => {
  console.error('voice_turn error:', e?.stack || String(e));
  process.exit(1);
});