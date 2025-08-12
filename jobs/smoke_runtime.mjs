#!/usr/bin/env node
import { getCapabilities } from '../core/runtime/capabilities.mjs';
import { loadRegistry, validateRegistry, selectModel } from '../core/runtime/modelRegistry.mjs';
import { route } from '../core/runtime/router.mjs';
import { writeManifest } from '../core/runtime/manifest.mjs';

(async () => {
  const caps = getCapabilities();
  const reg = loadRegistry();
  const errs = validateRegistry(reg);
  const selected = selectModel('asr', caps, reg) || selectModel('tts', caps, reg) || null;
  const routed = await route('task:plan', { payload:{goal:'smoke-runtime'}, options:{} })
                 .catch(e=>({error:String(e)}));
  const out = { time:new Date().toISOString(), caps, registryStats:Object.keys(reg.models||{}).length,
                registryErrors: errs, selected, routed };
  const p = writeManifest('logs/runtime_smoke.json', out);
  console.log('✅ runtime smoke ->', p);
})();
