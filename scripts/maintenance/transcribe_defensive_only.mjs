import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
import '../../_env.mjs';

// scripts/maintenance/transcribe_defensive_only.mjs

import fs from 'fs';
import path from 'path';
import { speak } from '../../core/voice/utils/tts_router.mjs';
import { transcribeWav } from '../../core/voice/utils/whisper_transcriber.mjs';

const FOLDER = 'voice/wav_training/defensive';

function getPromptFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.txt'));
}

async function processPrompt(file) {
  const base = file.replace(/\.txt$/, '');
  const txtPath = path.join(FOLDER, `${base}.txt`);
  const mp3Path = path.join(FOLDER, `${base}.mp3`);

  const prompt = fs.readFileSync(txtPath, 'utf-8').trim();
  if (!prompt) return;

  console.log(`🧠 Synthesizing: ${base}`);
  await speak(prompt, mp3Path);

  console.log(`🧾 Transcribing: ${base}`);
  transcribeWav(mp3Path);
}

async function main() {
  const files = getPromptFiles(FOLDER);
  for (const file of files) {
    await processPrompt(file);
  }

  console.log('✅ Defensive folder sync complete.');
}

main();
