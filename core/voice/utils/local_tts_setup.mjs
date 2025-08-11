import { requireEnv } from './env_guard.mjs';
import '../../_env.mjs';
// voice/utils/local_tts_setup.mjs

import { execSync } from 'child_process';
import path from 'path';

const TTS_COMMAND = [
  'tts',
  '--text', '"This is a test."',
  '--model_name', 'tts_models/en/ljspeech/glow-tts',
  '--vocoder_name', 'vocoder_models/en/ljspeech/hifigan_v2',
  '--out_path', 'voice/output/test.wav'
].join(' ');

console.log('🧠 Installing local voice TTS model stack for Aegis...');
console.log('📦 Installing: tts_models/en/ljspeech/glow-tts');
console.log('📦 Installing: vocoder_models/en/ljspeech/hifigan_v2');

try {
  execSync(TTS_COMMAND, { stdio: 'inherit' });
  console.log('✅ Local TTS setup complete. Voice sample saved to voice/output/test.wav');
} catch (err) {
  console.error('❌ TTS install failed:', err.message);
}