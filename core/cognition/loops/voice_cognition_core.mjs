// core/cognition/loops/voice_cognition_core.mjs
import OpenAI from 'openai';
import { requireEnv } from '../../voice/utils/env_guard.mjs'; // ✅

// Optional: if your tts router default-exports a speak() helper:
import speak from '../../core/voice/utils/tts_router.mjs';

const { OPENAI_API_KEY } = requireEnv(['OPENAI_API_KEY']);

const DRY_RUN = process.env.DRY_RUN === '1';
const prompt = process.argv.slice(2).join(' ') || 'Say hello.';
const model = process.env.COGNITION_MODEL || 'gpt-4o-mini';
const temperature = Number(process.env.COGNITION_TEMP || 0.7);
const systemPrompt =
  process.env.COGNITION_SYSTEM ||
  'You are Aegis. Be concise, helpful, and speak in a clear, natural tone.';

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

let text = '';
let errorObj = null;

try {
  const chat = await client.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      // IMPORTANT: content must be a string for Chat Completions
      { role: 'user', content: prompt },
    ],
  });

  text = chat?.choices?.[0]?.message?.content?.trim() ?? '';
} catch (err) {
  errorObj = err?.response?.data || err;
}

console.log('[cognition]', {
  prompt,
  model,
  response: text,
  error: errorObj || undefined,
});

// Speak if not dry and we have text
if (!DRY_RUN && text) {
  try {
    await speak(text, {
      // these are optional; the router can read env by itself
      voiceId: process.env.ELEVENLABS_VOICE_ID,
      provider: process.env.TTS_PROVIDER || 'router',
    });
  } catch (e) {
    console.error('[cognition] TTS failed:', e?.message || e);
  }
}