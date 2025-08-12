#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { wer, cer } from '../core/voice/utils/text_metrics.mjs';

// we’ll use your existing local wrapper:
import { transcribe } from '../core/voice/utils/whisper_transcriber.mjs';

function readJSON(p, d=null) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; }
}
function listWavs(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.wav')).map(f => path.join(dir, f));
}
function guessTruth(wavPath) {
  // If sidecar meta exists, use it; else look for prompts map in env SCORE_PROMPTS_FILE
  const sidecar = wavPath.replace(/\.wav$/i, '.meta.json');
  if (fs.existsSync(sidecar)) {
    const j = readJSON(sidecar, {});
    return j?.text ?? null;
  }
  const promptsFile = process.env.SCORE_PROMPTS_FILE || '';
  if (promptsFile && fs.existsSync(promptsFile)) {
    // map by filename match (basename->line with same index) – simple fallback
    const arr = fs.readFileSync(promptsFile, 'utf8').split(/\r?\n/).filter(Boolean);
    const m = path.basename(wavPath).match(/(\d+)/);
    if (m) {
      const idx = Number(m[1]) - 1; // 1-based in filenames
      return arr[idx] ?? null;
    }
  }
  return null;
}

async function main() {
  const DIR = process.argv[2] || 'core/voice/output/batch';
  const OUT = process.argv[3] || 'logs/voice/score';
  const WER_MAX = Number(process.env.WER_MAX ?? '0.15');
  const CER_MAX = Number(process.env.CER_MAX ?? '0.10');

  fs.mkdirSync(OUT, { recursive: true });
  const jsonl = path.join(OUT, `score_${Date.now()}.jsonl`);

  const wavs = fs.existsSync(DIR) && fs.lstatSync(DIR).isDirectory()
    ? listWavs(DIR)
    : (fs.existsSync(DIR) ? [DIR] : []);

  let ok=0, total=0;
  for (const wav of wavs) {
    total++;
    let truth = guessTruth(wav);
    let hyp = '';
    try {
      const r = await transcribe(wav); // your wrapper returns { text }
      hyp = r?.text || r?.result?.text || '';
    } catch (e) {
      fs.appendFileSync(jsonl, JSON.stringify({ wav, error: String(e) })+'\n');
      continue;
    }
    const s = {
      wav, truth, hyp,
      wer: truth ? wer(truth, hyp) : null,
      cer: truth ? cer(truth, hyp) : null,
    };
    s.pass = (s.wer ?? 1) <= WER_MAX && (s.cer ?? 1) <= CER_MAX;
    if (s.pass) ok++;
    fs.appendFileSync(jsonl, JSON.stringify(s)+'\n');
  }

  const summary = { ok, total, WER_MAX, CER_MAX, out: jsonl };
  console.log(JSON.stringify(summary, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e); process.exit(1); });
}