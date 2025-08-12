import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/maintenance/transcribe_missing_variation_files.mjs

import fs from 'fs';
import path from 'path';
import { transcribeWav } from "#voice-utils/whisper_transcriber.mjs";

const VARIATION_DIR = 'core/voice/output/variation_tests';

function findAllMp3Files(dir) {
  const folders = fs.readdirSync(dir).filter(f => f.startsWith('line_'));
  const files = [];

  for (const folder of folders) {
    const fullPath = path.join(dir, folder);
    const mp3s = fs.readdirSync(fullPath).filter(f => f.endsWith('.mp3'));

    for (const file of mp3s) {
      const audioPath = path.join(fullPath, file);
      const textPath = audioPath.replace(/\.mp3$/, '.txt');

      if (!fs.existsSync(textPath)) {
        files.push(audioPath);
      }
    }
  }

  return files;
}

function run() {
  const missingFiles = findAllMp3Files(VARIATION_DIR);

  if (missingFiles.length === 0) {
    console.log('✅ All variation .mp3 files are already transcribed.');
    return;
  }

  for (const file of missingFiles) {
    transcribeWav(file);
  }

  console.log(`✅ Transcribed ${missingFiles.length} missing variation files.`);
}

run();