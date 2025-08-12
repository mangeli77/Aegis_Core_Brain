#!/usr/bin/env node
/**
 * Grow the Voice‑2 dataset by synthesizing prompts from a JSONL manifest.
 * Reads NDJSON line-by-line (tolerates blank lines / comments).
 * For each {audio, text, style?} it can optionally re‑synthesize new text via LLM
 * and/or route to ElevenLabs (or local TTS) to produce wavs in batches.
 *
 * Env:
 *  MANIFEST=path/to/file.jsonl   (default: dataset/voice2_styles_manifest.jsonl)
 *  BATCH=24                      how many to synthesize this run (default 24)
 *  VOICE_MODE=elevenlabs|local   current TTS mode (default from .env)
 *  ELEVENLABS_VOICE_ID=...       if VOICE_MODE=elevenlabs
 *  OUT_DIR=core/voice/output/train/incoming
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MANIFEST = process.env.MANIFEST || 'dataset/voice2_styles_manifest.jsonl';
const OUT_DIR  = process.env.OUT_DIR  || 'core/voice/output/train/incoming';
const BATCH    = Number(process.env.BATCH || 24);

const VOICE_MODE = process.env.VOICE_MODE || 'elevenlabs';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || process.env.ELEVENLABS_VOICE_ID_DEFAULT || '';

function logJSON(obj){ console.log(JSON.stringify(obj, null, 2)); }
function mustDir(p){ fs.mkdirSync(p, { recursive: true }); }

async function* readJsonlLines(file) {
  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });
  for await (const raw of rl) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    try {
      yield JSON.parse(line);
    } catch (e) {
      // show context and continue rather than crash
      console.error(`Skipping bad JSONL line: ${line.slice(0, 200)}...`);
    }
  }
}

async function synthOne(text, idx, style) {
  // TODO: you can add an LLM step here to expand/perturb text if desired
  const base = `clip_${String(idx).padStart(4,'0')}`;
  const out  = path.join(OUT_DIR, `${base}.wav`);
  const meta = path.join(OUT_DIR, `${base}.meta.json`);

  if (VOICE_MODE === 'elevenlabs') {
    await speakElevenLabs(text, out, ELEVENLABS_VOICE_ID);
  } else {
    await speakLocal(text, out); // deterministic “say” path you already wired
  }

  const record = {
    text,
    style: style || null,
    outPath: out,
    mode: VOICE_MODE,
    created: new Date().toISOString()
  };
  fs.writeFileSync(meta, JSON.stringify(record, null, 2));
  return { ok: true, out };
}

// --- minimal ElevenLabs + local TTS helpers (re‑use your existing ones if you prefer)

async function speakElevenLabs(text, outPath, voiceId) {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY missing');
  }
  if (!voiceId) {
    throw new Error('ELEVENLABS_VOICE_ID missing');
  }
  // use your existing job/util; here’s a very small streaming wrapper via curl to keep it simple
  // macOS: create a temp wav via curl; you already collect into mp3 sometimes — we normalize to wav later if needed
  const tmp = outPath.replace(/\.wav$/, '.mp3');
  const cmd = [
    'curl','-sS','-X','POST',
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    '-H', 'accept: audio/mpeg',
    '-H', `xi-api-key: ${process.env.ELEVENLABS_API_KEY}`,
    '-H', 'Content-Type: application/json',
    '--data-binary', Buffer.from(JSON.stringify({
      text, model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.35, similarity_boost: 0.7 }
    })).toString()
  ];
  await execOrThrow(cmd, tmp);
  // convert mp3→wav 16k mono
  await execOrThrow(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',tmp,'-ac','1','-ar','16000',outPath]);
  fs.rmSync(tmp, { force: true });
}

async function speakLocal(text, outPath) {
  // macOS say → wav (16k mono)
  await execOrThrow(['ffmpeg','-y','-hide_banner','-loglevel','error',
    '-f','lavfi','-t','0.1','-i','anullsrc', outPath]); // precreate container
  await execOrThrow(['say','-v','Alex','-r','170','-o', outPath, '--data-format=LEI16@16000', text]);
}

import { spawn } from 'node:child_process';
function execOrThrow(args, outFileIfCurl) {
  return new Promise((resolve, reject) => {
    const isCurl = args[0] === 'curl' && outFileIfCurl;
    const child = spawn(args[0], args.slice(1), {
      stdio: isCurl ? ['ignore', fs.openSync(outFileIfCurl,'w'), 'inherit'] : 'inherit'
    });
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(args.join(' ') + ' -> ' + code)));
  });
}

(async () => {
  mustDir(OUT_DIR);

  let produced = 0;
  let idxBase = Math.floor(Date.now()/1000) % 100000;

  // count lines quickly for status
  let manifestLines = 0;
  for await (const _ of readJsonlLines(MANIFEST)) manifestLines++;
  logJSON({ ok:true, samples: manifestLines, manifest: MANIFEST });

  // produce a batch by streaming the file again
  for await (const row of readJsonlLines(MANIFEST)) {
    const text  = (row.text || '').toString().trim();
    const style = row.style || null;
    if (!text) continue;

    try {
      await synthOne(text, ++idxBase, style);
      produced++;
      if (produced >= BATCH) break;
    } catch (e) {
      console.error('synth error:', e.message);
    }
  }

  console.log(JSON.stringify({ ok:true, produced, outDir: OUT_DIR }));
  process.exit(0);
})();