import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/maintenance/transcribe_missing_training_files.mjs

import fs from 'fs';
import path from 'path';
import { transcribeWav } from "#voice-utils/whisper_transcriber.mjs";

const baseDir = path.resolve('./voice/wav_training');
const categories = ['assertive', 'bonding', 'neutral', 'reflective', 'technical'];

async function transcribeMissing() {
  console.log('🔍 Scanning for missing transcripts in training files...');
  let count = 0;

  for (const category of categories) {
    const dir = path.join(baseDir, category);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3'));
    for (const file of files) {
      const mp3Path = path.join(dir, file);
      const txtPath = mp3Path.replace(/\.mp3$/, '.txt');

      if (!fs.existsSync(txtPath)) {
        console.log(`🎙️  Transcribing: ${file}`);
        try {
          await transcribeWav(mp3Path);
          count++;
        } catch (err) {
          console.warn(`⚠️  Failed to transcribe ${file}:`, err.message);
        }
      }
    }
  }

  console.log(`✅ Transcription complete. ${count} files processed.`);
}

await transcribeMissing();
