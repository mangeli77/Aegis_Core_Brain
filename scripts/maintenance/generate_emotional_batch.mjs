import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/maintenance/generate_emotional_batch.mjs

import fs from 'fs';
import path from 'path';
import { speak } from "#voice-utils/tts_router.mjs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EMOTIONS = [
  'neutral', 'reflective', 'assertive', 'technical', 'bonding',
  'confident', 'defensive', 'compassionate', 'humorous', 'sarcastic',
  'charismatic', 'frustrated', 'apologetic'
];

const OUTPUT_DIR = path.resolve(__dirname, '../../core/voice/output/emotional_training');
const LOG_FILE = path.resolve(__dirname, '../../core/memory/Reflection/self_teach_voice.md');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getPrompt(emotion) {
  const base = 'This is a simulated training line.';
  return `${base} Emotion: ${emotion}.`;
}

async function synthesizeEmotion(emotion) {
  const text = getPrompt(emotion);
  const filename = `${emotion}_sample.mp3`;
  const outputPath = path.join(OUTPUT_DIR, filename);

  console.log(`\n🗣️ Synthesizing: ${emotion}`);
  await speak(text);

  const logEntry = `- ${new Date().toISOString()} | ${emotion} | ${text}`;
  fs.appendFileSync(LOG_FILE, logEntry + '\n');
  console.log(`✅ Saved: ${outputPath}`);
}

async function runBatch() {
  ensureDir(OUTPUT_DIR);
  console.log('\n🎙️ Starting emotional synthesis batch...');

  for (const emotion of EMOTIONS) {
    await synthesizeEmotion(emotion);
  }

  console.log('\n🏁 Batch complete. Voice samples stored in emotional_training/.');
}

runBatch();