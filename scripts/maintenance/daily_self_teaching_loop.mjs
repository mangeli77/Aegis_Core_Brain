import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/maintenance/daily_self_teaching_loop.mjs

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve();
const logFile = path.join(projectRoot, 'logs/daily_voice_train.log');

function runScript(relativePath) {
  const fullPath = path.join(projectRoot, relativePath);
  console.log(`\n▶ Running: ${relativePath}`);
  try {
    execSync(`node ${fullPath}`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Error running ${relativePath}:`, err.message);
  }
}

function main() {
  const startTime = new Date().toISOString();
  fs.appendFileSync(logFile, `\n\n🧠 Daily Voice Autonomy Loop started at ${startTime}\n`);

  // Phase 1: Reanalyze curated text memory
  runScript('scripts/patches/self_teach_patch.mjs');

  // Phase 2: Reanalyze emotional training wavs
  runScript('scripts/maintenance/self_teach_voice_patch.mjs');

  // Phase 3: Transcribe any missing voice samples
  runScript('scripts/maintenance/transcribe_missing_voice_training.mjs');

  // Phase 4: Generate emotional prompt scripts
  runScript('scripts/maintenance/generate_training_prompts.mjs');

  // Phase 5: Submit prompts to ElevenLabs
  runScript('scripts/maintenance/send_to_elevenlabs.mjs');

  // Phase 6: Transcribe ElevenLabs responses + score tone
  runScript('scripts/maintenance/review_voice_feedback.mjs');

  const endTime = new Date().toISOString();
  fs.appendFileSync(logFile, `✅ Voice loop complete at ${endTime}\n`);
  console.log('\n✅ Aegis daily voice autonomy loop complete.');
}

main();
