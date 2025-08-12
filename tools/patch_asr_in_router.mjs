import fs from 'node:fs';

const p = 'core/runtime/dispatch.mjs';
let s = fs.readFileSync(p, 'utf8');

// Replace the whole ASR handler block with a call into the picked model's transcriber
// It's intentionally liberal in matching to handle your current file shape.
s = s.replace(
  /if\s*\(\s*task\s*===\s*['"]asr['"]\s*\)\s*\{[\s\S]*?\n\}/,
  `if (task === 'asr') {
    const r = await mod.transcribe(payload.wavPath || '');
    return { ok: true, task, model: pick.name, result: r };
  }`
);

fs.writeFileSync(p, s);
console.log('✓ Patched ASR branch in', p);
