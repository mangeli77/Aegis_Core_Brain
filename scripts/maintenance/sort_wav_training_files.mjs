import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { transcribeWav } from '../../core/voice/utils/whisper_transcriber.mjs';
import { detectEmotionWeights } from '../../core/voice/utils/emotion_weights.mjs';

const rootDir = path.resolve('./voice/wav_training');
const unsortedDir = path.join(rootDir, '_unsorted');
const emotionDirs = ['assertive', 'bonding', 'neutral', 'reflective', 'technical'];

function ensureEmotionFolders() {
  for (const dir of emotionDirs) {
    const fullPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

async function sortSamples() {
  console.log('🧠 Sorting wav training samples by emotional category...');

  const files = fs.readdirSync(unsortedDir).filter(f => f.endsWith('.mp3'));
  if (files.length === 0) {
    console.log('⚠️ No unsorted samples found in:', unsortedDir);
    return;
  }

  ensureEmotionFolders();

  for (const file of files) {
    const filePath = path.join(unsortedDir, file);
    try {
      const transcript = await transcribeWav(filePath);
      if (!transcript) {
        console.warn(`⚠️ Skipping: ${file} — no transcript generated.`);
        continue;
      }

      const emotion = detectEmotionWeights(transcript);
      const targetDir = path.join(rootDir, emotion || 'neutral');
      const destPath = path.join(targetDir, file);

      fs.renameSync(filePath, destPath);
      console.log(`📦 Moved: ${file} → ${emotion || 'neutral'}`);
    } catch (err) {
      console.error(`❌ Failed processing ${file}:`, err.message);
    }
  }

  console.log('✅ All unsorted samples have been classified and moved.');
}

await sortSamples();