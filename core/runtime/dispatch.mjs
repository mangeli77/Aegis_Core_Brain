#!/usr/bin/env node
import os from 'node:os';
import path from 'node:path';
import { loadRegistry, selectModel, resolvePath } from './modelRegistry.mjs';

export async function runTask(task, payload={}, goal={}, options={}) {
  const caps = { memGB: Math.floor(os.totalmem()/1e9) };
  const reg  = loadRegistry();
  const pick = selectModel(task, caps, reg);
  if (!pick) return { ok:false, error:`no model for task=${task}` };

  const abs = resolvePath(pick.path);
  const mod = await import('file://' + abs);

  if (task === 'tts') {
    const outPath = payload.outPath || 'core/voice/output/test.wav';
    const r = await mod.speak(payload.text||'', outPath);
    return { ok:true, task, model: pick.name, result: r };
  }

  if (task === 'asr') {
    const r = await mod.transcribe(payload.wavPath || '');
    return { ok: true, task, model: pick.name, result: r };
  }

if (import.meta.url === `file://${process.argv[1]}`) {
  runTask(process.argv[2]||'tts', { text:'smoke' }, { goal:'smoke' }).then(r=>console.log(JSON.stringify(r,null,2)));
}
