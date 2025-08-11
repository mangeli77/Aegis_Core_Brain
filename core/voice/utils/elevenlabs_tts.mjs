import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// voice/utils/elevenlabs_tts.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import fetch from 'node-fetch';
import '../_env.mjs'; // ensure env is loaded

/**
 * Synthesize with ElevenLabs and write an MP3 file.
 * @param {string} text
 * @param {string} voiceId
 * @param {string} outPath
 * @param {object} opts
 */
export async function synthesizeWithElevenLabs(text, voiceId, outPath, opts = {}) {
  const key = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_KEY || '';
  if (!key) {
    throw new Error('ELEVENLABS_API_KEY is missing.');
  }
  if (!voiceId) {
    throw new Error('ELEVENLABS_VOICE_ID is missing (voiceId was empty).');
  }

  const {
    model_id = 'eleven_multilingual_v2',
    stability = 0.35,
    similarity_boost = 0.75,
    style = 0.0,
    use_speaker_boost = true,
  } = opts;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  if (process.env.DEBUG_ELEVEN) {
    const head = key.slice(0, 6);
    // log once, minimally
    console.log(`[el-tts] POST ${url}  key sk_${head}…  model ${model_id}`);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id,
      voice_settings: {
        stability,
        similarity_boost,
        style,
        use_speaker_boost,
      },
    }),
  });

  if (!res.ok) {
    // Surface server message to logs
    const msg = await res.text().catch(() => '');
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${res.statusText}${msg ? ` :: ${msg}` : ''}`);
  }

  const mp3 = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, mp3);
  return outPath;
}