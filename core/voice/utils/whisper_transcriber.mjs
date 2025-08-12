#!/usr/bin/env node
import fs from 'node:fs';
import { transcribeLocal } from './my_local_whisper.mjs';

export async function transcribe(wavPath) {
  if (!fs.existsSync(wavPath)) throw new Error(`whisper_transcriber: wav not found ${wavPath}`);
  const r = await transcribeLocal(wavPath);
  return { text: r.text };
}

// quick CLI: `node core/voice/utils/whisper_transcriber.mjs core/voice/output/test.wav`
if (import.meta.url === `file://${process.argv[1]}`) {
  const wav = process.argv[2] || 'core/voice/output/test.wav';
  transcribe(wav).then(r => console.log(JSON.stringify({ ok:true, result:r }, null, 2)));
}
