import { requireEnv } from './env_guard.mjs';
// voice/utils/tts_router.mjs

// --- Load env from project root

import fs from 'node:fs/promises';
import path from 'node:path';

// Optional retry utility if available, otherwise inline retry
async function retry(fn, retries = 3, delayMs = 500) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.warn(`Retry ${attempt}/${retries} failed: ${err.message || err}`);
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  }
  throw lastErr;
}

const API_KEY  = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_KEY || '';
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '';
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
const TTS_PROVIDER = (process.env.TTS_PROVIDER || 'elevenlabs').toLowerCase();

async function synthLocal(text, outPath) {
  const SILENT_MP3 = Buffer.from([0x49,0x44,0x33,0x03,0,0,0,0,0,0x21]); // tiny ID3 header
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, SILENT_MP3);
}

async function elevenlabsSpeak(text, outPath, voiceId = VOICE_ID, apiKey = API_KEY) {
  if (!apiKey) throw new Error('ElevenLabs: missing ELEVENLABS_API_KEY');
  if (!voiceId) throw new Error('ElevenLabs: missing ELEVENLABS_VOICE_ID');

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
  const body = {
    text,
    model_id: MODEL_ID,
    voice_settings: {
      stability: 0.35,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let txt = '';
    try { txt = await res.text(); } catch {}
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${res.statusText} :: ${txt}`);
  }

  const mp3 = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, mp3);
  return outPath;
}

export async function speak(text, outPath, opts = {}) {
  if (!text?.trim()) throw new Error('speak(): text is empty');
  const provider = (opts.provider || TTS_PROVIDER).toLowerCase();
  const abs = path.isAbsolute(outPath) ? outPath : path.resolve(process.cwd(), outPath);

  if (provider === 'elevenlabs') {
    try {
      return await retry(() =>
        elevenlabsSpeak(text, abs, opts.voiceId || VOICE_ID, API_KEY),
        3, 750
      );
    } catch (err) {
      console.error('❌ ElevenLabs error:', err.message || err);
      console.warn('↪︎ Falling back to local TTS for this line.');
      await synthLocal(text, abs);
      return abs;
    }
  }

  await synthLocal(text, abs);
  return abs;
}