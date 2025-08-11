import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/test/tts_router_smoke.mjs
// Quick sanity test for voice/utils/tts_router.mjs

import { speak } from '../../core/voice/utils/tts_router.mjs';

const outPath = 'voice/output/_smoke/el_test.mp3';
const text = 'Router smoke test — one two three.';

// Optional: force provider via env, e.g. SMOKE_PROVIDER=local
const provider = (process.env.SMOKE_PROVIDER || '').toLowerCase();
const opts = provider ? { provider } : {};

try {
  const saved = await speak(text, outPath, opts);
  console.log('[smoke] saved:', saved);
  process.exit(0);
} catch (err) {
  console.error('[smoke] FAILED:', err?.message || err);
  process.exit(1);
}