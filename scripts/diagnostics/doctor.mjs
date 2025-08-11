import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
import '../_env.mjs';
import { execSync } from 'child_process';

function runStep(desc, cmd) {
  console.log(`\n[STEP] ${desc}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ ${desc} passed`);
  } catch {
    console.error(`❌ ${desc} failed`);
    process.exit(1);
  }
}

// 1. Env sanity
console.log(`[env] ELEVENLABS_API_KEY head: ${process.env.ELEVENLABS_API_KEY?.slice(0,6)}`);
if (!process.env.ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY missing in env');
  process.exit(1);
}

// 2. Probe ElevenLabs auth
runStep('ElevenLabs Auth Probe', 'node scripts/test/probe_elevenlabs_auth.mjs');

// 3. Tiny TTS
runStep('Tiny TTS', 'node scripts/test/test_elevenlabs_direct.mjs --text="Doctor check OK" --voice="FG350wLfM2HDwTst4Q7I"');

// 4. Done
console.log('\n✅ Doctor check complete. All systems go.');