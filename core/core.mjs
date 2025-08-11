import { requireEnv } from './voice/utils/env_guard.mjs';
// core.mjs – Aegis Brain (Rev 5)
export async function runAegis(input, memory, identity) {
  const reply = await globalThis.routeLLM(input, memory, identity);
  return reply;
}