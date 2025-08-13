#!/usr/bin/env node
import 'dotenv/config';

const needEnv = ['ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID'];
const envFlags = Object.fromEntries(needEnv.map(k => [k, !!process.env[k]]));

const out = {
  ok: envFlags.ELEVENLABS_API_KEY && envFlags.ELEVENLABS_VOICE_ID,
  stage: 'env',
  env: envFlags,
  VOICE_MODE: process.env.VOICE_MODE ?? null
};

if (!out.ok) out.error = 'Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID';

process.stdout.write(JSON.stringify(out, null, 2));
