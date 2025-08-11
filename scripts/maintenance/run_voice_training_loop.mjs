import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/maintenance/run_voice_training_loop.mjs

import { execSync } from 'child_process';
import { speak } from '../../core/voice/utils/tts_router.mjs';

async function run() {
  console.log('🌀 Running full voice training loop...');

  try {
    execSync('node scripts/patches/self_teach_patch.mjs', { stdio: 'inherit' });
    execSync('node scripts/maintenance/self_teach_voice_patch.mjs', { stdio: 'inherit' });
    execSync('node scripts/maintenance/generate_voice_training_script.mjs', { stdio: 'inherit' });
    execSync('node scripts/maintenance/transcribe_missing_training_files.mjs', { stdio: 'inherit' });

    await speak("Voice training loop complete. Reflections saved. Evolution in progress.");

    console.log('✅ Voice training loop finished.');
  } catch (err) {
    console.error('❌ Loop failed:', err.message);
  }
}

await run();
