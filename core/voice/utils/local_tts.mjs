#!/usr/bin/env node
// macOS-only local TTS using `say`. Writes a 16 kHz PCM WAV and a .meta.json.

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

/**
 * Speak `text` to a WAV on macOS using the built-in `say` command.
 * Always writes:
 *   - WAV at `outPath` (16 kHz, mono, PCM16)
 *   - sidecar JSON with ground truth at `${outPath}.meta.json`
 *
 * @param {string} text
 * @param {string} outPath
 * @param {object} opts   { voice?:string, rate?:number }
 * @returns {Promise<{ok:boolean,outPath:string,meta:object}>}
 */
export async function speak(text, outPath = 'core/voice/output/test.wav', opts = {}) {
  if (!text || !String(text).trim()) {
    throw new Error('local_tts: text is empty');
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

const voice = opts.voice ?? process.env.VOICE_VOICE ?? 'Samantha';
const rate  = opts.rate  ?? Number(process.env.VOICE_RATE || 200);

  // `say` flags:
  //   -v <voice>
  //   -r <rate>
  //   -o <file>
  //   --data-format=LEI16@16000   => Little-Endian, Int16, 16000 Hz
  //   --file-format=WAVE
  await run('say', [
    '-v', voice,
    '-r', String(rate),
    '-o', outPath,
    '--data-format=LEI16@16000',
    '--file-format=WAVE',
    text,
  ]);

  const meta = {
    text,
    sampleRate: 16000,
    ms: 1000,                 // we don’t know exact duration; keep fixed for now
    type: 'say',
    voice,
    rate,
    created: new Date().toISOString(),
  };
  fs.writeFileSync(outPath.replace(/\.wav$/i, '') + '.meta.json', JSON.stringify(meta, null, 2));

  return { ok: true, outPath, meta };
}

/* CLI: node core/voice/utils/local_tts.mjs "hello" core/voice/output/test.wav */
if (import.meta.url === `file://${process.argv[1]}`) {
  const text = process.argv[2] ?? 'hello from local_tts';
  const out  = process.argv[3] ?? 'core/voice/output/test.wav';
  speak(text, out)
    .then(r => console.log(JSON.stringify(r, null, 2)))
    .catch(e => { console.error(e.message); process.exit(1); });
}