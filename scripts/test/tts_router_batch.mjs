import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/test/tts_router_batch.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

// ✅ Correct relative path for your repo
import '../../_env.mjs';
import { speak } from "#voice-utils/tts_router.mjs";

const outDir = `core/voice/output/batch_${new Date().toISOString().replace(/[:.]/g, '-')}`;
await fs.mkdir(outDir, { recursive: true });

const lines = [
  ['neutral',   'Hello from Aegis. This is a routing and retry check.'],
  ['friendly',  'Quick voice pass to make sure everything is healthy.'],
  ['concise',   'Router OK. Latency nominal. Writing MP3.'],
  ['energetic', 'All systems green! Moving on to the next step.'],
  ['reflective','We finished the smoke test; now we are creating a small batch.']
];

const VOICE_OVERRIDE = process.env.ELEVENLABS_VOICE_ID || undefined;
const PROVIDER = process.env.TTS_PROVIDER || 'elevenlabs';

for (const [style, text] of lines) {
  const file = path.join(outDir, `sample_${style}.mp3`);
  await speak(`[${style}] ${text}`, file, { provider: PROVIDER, voiceId: VOICE_OVERRIDE });
  console.log('✅ saved', file);
}

console.log('\nDone. Output folder:', outDir);