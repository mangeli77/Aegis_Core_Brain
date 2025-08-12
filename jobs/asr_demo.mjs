#!/usr/bin/env node
import('./../core/runtime/router.mjs').then(async m => {
  const route = m.default || m.route;
  const wav   = process.argv[2] ?? 'core/voice/output/test.wav';
  const r = await route('asr', { wavPath: wav }, { goal: 'demo' });
  console.log(JSON.stringify(r, null, 2));
});
