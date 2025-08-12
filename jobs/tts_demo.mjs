#!/usr/bin/env node
import('./../core/runtime/router.mjs').then(async m => {
  const route = m.default || m.route;
  const text   = process.argv[2] ?? 'ghost ops';
  const out    = process.env.VOICE_OUTPUT_PATH ?? 'core/voice/output/test.wav';
  const r = await route('tts', { text, outPath: out }, { goal: 'demo' });
  console.log(JSON.stringify(r, null, 2));
});
