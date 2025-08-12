#!/usr/bin/env node
// Simple voice router. Two modes:
//   - VOICE_MODE=local : use macOS `say` via local_tts.mjs
//   - (default) beep  : write a deterministic 1s 440Hz tone WAV (free) + sidecar

import fs from 'node:fs';
import path from 'node:path';
import { speak as speakLocal } from './local_tts.mjs';

/**
 * Route a TTS request.
 * @param {string} text
 * @param {string} outPath
 * @returns {Promise<{ok:boolean,outPath:string,meta:object}>}
 */
export async function speak(text, outPath = 'core/voice/output/test.wav') {
  if (!text || !String(text).trim()) throw new Error('tts_router: text is empty');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const mode = (process.env.VOICE_MODE || 'beep').toLowerCase();

 if (mode === 'local') {
  return await speakLocal(text, outPath, {
    voice: process.env.VOICE_VOICE,
    rate:  Number(process.env.VOICE_RATE || '')
           || undefined,
  });
}

  // Default: generate a deterministic beep (no cost, good for smoke tests + training plumb‑through)
  const meta = await writeToneWav(outPath, {
    ms: 1000, sampleRate: 16000, freq: 440, amp: 0.25,
    text, type: 'beep',
  });
  return { ok: true, outPath, meta };
}

/**
 * Write a valid PCM16 mono WAV and a sidecar meta.json.
 * Header uses explicit offsets; tested as macOS-friendly.
 */
async function writeToneWav(outPath, {
  ms = 1000, sampleRate = 16000, freq = 440, amp = 0.25, text = '', type = 'beep',
} = {}) {
  const n = Math.floor(sampleRate * ms / 1000);
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataBytes = n * blockAlign;

  // header (44 bytes)
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0);
  hdr.writeUInt32LE(36 + dataBytes, 4);     // chunkSize
  hdr.write('WAVE', 8);
  hdr.write('fmt ', 12);
  hdr.writeUInt32LE(16, 16);                // subchunk1Size (PCM)
  hdr.writeUInt16LE(1, 20);                 // audio format = PCM
  hdr.writeUInt16LE(channels, 22);
  hdr.writeUInt32LE(sampleRate, 24);
  hdr.writeUInt32LE(byteRate, 28);
  hdr.writeUInt16LE(blockAlign, 32);
  hdr.writeUInt16LE(bitsPerSample, 34);
  hdr.write('data', 36);
  hdr.writeUInt32LE(dataBytes, 40);

  // data
  const data = Buffer.allocUnsafe(dataBytes);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const s = Math.max(-1, Math.min(1, amp * Math.sin(2 * Math.PI * freq * t)));
    data.writeInt16LE((s * 32767) | 0, i * 2);
  }

  fs.writeFileSync(outPath, Buffer.concat([hdr, data]));

  const meta = {
    text,
    sampleRate,
    ms,
    type,
    created: new Date().toISOString(),
  };
  fs.writeFileSync(outPath.replace(/\.wav$/i, '') + '.meta.json', JSON.stringify(meta, null, 2));
  return meta;
}

/* CLI: node core/voice/utils/tts_router.mjs "hello" core/voice/output/test.wav */
if (import.meta.url === `file://${process.argv[1]}`) {
  const text = process.argv[2] ?? 'ghost ops';
  const out  = process.argv[3] ?? 'core/voice/output/test.wav';
  speak(text, out)
    .then(r => console.log(JSON.stringify(r, null, 2)))
    .catch(e => { console.error(e.message); process.exit(1); });
}