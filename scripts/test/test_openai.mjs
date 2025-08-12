import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/test/test_openai.mjs
import '../_env.mjs';
import OpenAI from 'openai';

async function main() {
  const key   = (process.env.OPENAI_API_KEY || '').trim();
  const base  = (process.env.OPENAI_API_BASE || '').trim() || undefined; // keep default unless you use a proxy
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  console.log('[probe] base:', base || '(default)');
  console.log('[probe] key head:', key.slice(0, 6), 'len:', key.length);
  if (!key) {
    console.log('SKIP: OPENAI_API_KEY not set');
    process.exit(0);
  }

  try {
    const client = new OpenAI({ apiKey: key, baseURL: base });

    // quick capability check:
    const resp = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Reply literally with: ping' }],
      max_tokens: 2,
    });

    console.log('OpenAI OK ::', resp.choices?.[0]?.message?.content);
  } catch (err) {
    console.error('OpenAI FAIL ::', err?.response?.data || err?.message || err);
    process.exit(1);
  }
}
main();