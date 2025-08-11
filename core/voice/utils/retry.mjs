import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// voice/utils/retry.mjs
export async function retry(fn, {
  tries = 3,
  baseMs = 400,   // initial backoff
  maxMs = 3000,   // backoff cap
  onFail = () => {}
} = {}) {
  let attempt = 0, lastErr;
  while (attempt < tries) {
    try {
      return await fn(attempt + 1);
    } catch (err) {
      lastErr = err;
      await onFail(err, attempt + 1);
      if (++attempt >= tries) break;
      const wait = Math.min(maxMs, baseMs * 2 ** (attempt - 1)) + Math.floor(Math.random() * 150);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}