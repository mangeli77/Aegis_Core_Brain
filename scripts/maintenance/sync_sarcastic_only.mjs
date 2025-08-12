import { requireEnv } from "#voice-utils/env_guard.mjs";
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { speak } from "#voice-utils/tts_router.mjs";
import { transcribeWav } from "#voice-utils/whisper_transcriber.mjs";

const folder = path.resolve('./voice/wav_training/sarcastic');

async function syncSarcastic() {
  console.log('🌀 Syncing sarcastic folder only...');

  const files = fs.readdirSync(folder).filter(f => f.endsWith('.txt') && f.startsWith('sample_'));

  for (const file of files) {
    const baseName = file.replace('.txt', '');
    const txtPath = path.join(folder, `${baseName}.txt`);
    const mp3Path = path.join(folder, `${baseName}.mp3`);
    const transcriptPath = path.join(folder, `${baseName}.wav.txt`);

    // Generate MP3 if missing
    if (!fs.existsSync(mp3Path)) {
      const text = fs.readFileSync(txtPath, 'utf-8').trim();
      console.log(`🎤 Synthesizing: ${baseName}.mp3`);
      await speak(text, mp3Path);
    }

    // Generate Transcript if missing
    if (!fs.existsSync(transcriptPath)) {
      console.log(`🧠 Transcribing: ${baseName}.mp3`);
      const result = await transcribeWav(mp3Path);
      fs.writeFileSync(transcriptPath, result, 'utf-8');
    }
  }

  console.log('✅ Sarcastic folder sync complete.');
}

await syncSarcastic();