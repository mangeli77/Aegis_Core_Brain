import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// _env.mjs
import dotenv from 'dotenv';

// 1) Load .env → process.env
dotenv.config();

// 2) Normalize: trim and mirror ELEVENLABS_API_KEY <-> ELEVENLABS_KEY
for (const k of ['ELEVENLABS_API_KEY', 'ELEVENLABS_KEY', 'ELEVENLABS_VOICE_ID']) {
  if (typeof process.env[k] === 'string') process.env[k] = process.env[k].trim();
}
if (!process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_KEY) {
  process.env.ELEVENLABS_API_KEY = process.env.ELEVENLABS_KEY;
}
if (!process.env.ELEVENLABS_KEY && process.env.ELEVENLABS_API_KEY) {
  process.env.ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
}

// 3) Validate shape early with clear messages
const key = process.env.ELEVENLABS_API_KEY || '';
const voiceId = process.env.ELEVENLABS_VOICE_ID || '';

const problems = [];
if (!key) {
  problems.push('ELEVENLABS_API_KEY is missing. Put it in your .env file.');
} else {
  const looksRight = key.startsWith('sk_') && key.length >= 40 && key.length <= 80;
  if (!looksRight) {
    problems.push(`ELEVENLABS_API_KEY looks wrong (head "${key.slice(0,6)}", len ${key.length}).`);
  }
}

if (!voiceId) {
  problems.push('ELEVENLABS_VOICE_ID is missing. Add your ElevenLabs voice id to .env.');
}

if (problems.length) {
  console.error('\n[env] Configuration error:\n- ' + problems.join('\n- ') +
    '\n\nTips:\n  • Make sure .env is at project root and saved.\n' +
    '  • Restart your terminal or run:  exec $SHELL -l\n' +
    '  • To double-check: node -e "import(\'./_env.mjs\')"');
  process.exit(1);
}

// 4) Optional debug
if (process.env.DEBUG_ENV) {
  console.log('[env] ELEVENLABS_API_KEY head:', key.slice(0,6), 'len:', key.length);
  console.log('[env] ELEVENLABS_VOICE_ID   :', voiceId);
}

export {};