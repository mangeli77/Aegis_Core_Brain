import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/test/probe_elevenlabs_auth.mjs
import 'dotenv/config';
import fs from 'node:fs/promises';

// --- config pulled from .env ---
const key     = process.env.ELEVENLABS_API_KEY || '';
const voiceId = process.env.ELEVENLABS_VOICE_ID || 'FG350wLfM2HDwTst4Q7I';
const base    = 'https://api.elevenlabs.io/v1';

if (!key) {
  console.error('❌ ELEVENLABS_API_KEY is empty. Check your .env.');
  process.exit(1);
}

console.log('[probe] key head:', key.slice(0, 6), 'len:', key.length);
console.log('[probe] voice id :', voiceId);

async function dump(label, res) {
  const text = await res.text();
  console.log(`[${label}] status:`, res.status);
  if (!res.ok) console.log(`[${label}] body  :`, text);
  return text;
}

async function go() {
  // 1) simple auth probe
  const user = await fetch(`${base}/user`, {
    headers: { 'xi-api-key': key },
  });
  await dump('user', user);

  // 2) list voices
  const voices = await fetch(`${base}/voices`, {
    headers: { 'xi-api-key': key },
  });
  await dump('voices', voices);

  // 3) tiny TTS probe (will save mp3 only if 200)
  const ttsRes = await fetch(`${base}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: 'Auth probe from Aegis.',
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.35,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!ttsRes.ok) {
    await dump('tts', ttsRes);
  } else {
    const mp3 = Buffer.from(await ttsRes.arrayBuffer());
    const path = '/tmp/el_probe.mp3';
    await fs.writeFile(path, mp3);
    console.log('[tts] saved :', path);
  }
}

go().catch(err => {
  console.error('Fatal probe error:', err);
  process.exit(1);
});