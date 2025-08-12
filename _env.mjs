import { requireEnv } from "./core/voice/utils/env_guard.mjs";
import dotenv from 'dotenv';
dotenv.config();

function clean(val) {
  return (val ?? '')
    .toString()
    .trim()
    .replace(/^['"]|['"]$/g, ''); // strip accidental wrapping quotes
}

function setIfMissing(key, value) {
  if (!process.env[key] && value) {
    process.env[key] = value;
  }
}

// --- Clean existing values ---
if (process.env.ELEVENLABS_API_KEY) {
  process.env.ELEVENLABS_API_KEY = clean(process.env.ELEVENLABS_API_KEY);
}
if (process.env.ELEVENLABS_KEY) {
  process.env.ELEVENLABS_KEY = clean(process.env.ELEVENLABS_KEY);
}

// --- Mirror values if one is missing ---
setIfMissing('ELEVENLABS_API_KEY', process.env.ELEVENLABS_KEY);
setIfMissing('ELEVENLABS_KEY', process.env.ELEVENLABS_API_KEY);

// --- Debug logging (optional) ---
if (process.env.DEBUG_ENV) {
  console.log('[env] ELEVENLABS_API_KEY head:', process.env.ELEVENLABS_API_KEY?.slice(0, 6),
              'len:', process.env.ELEVENLABS_API_KEY?.length);
  console.log('[env] ELEVENLABS_KEY head:', process.env.ELEVENLABS_KEY?.slice(0, 6),
              'len:', process.env.ELEVENLABS_KEY?.length);
}

export {};
// --- Aegis voice path exports (added by install_voice_path_hardening.sh)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname);
export const CORE_DIR = path.join(ROOT_DIR, 'core');
export const CORE_VOICE_DIR = path.join(CORE_DIR, 'voice');
export const CORE_VOICE_OUTPUT_DIR = path.join(CORE_VOICE_DIR, 'output');

export const WHISPER_BIN = "vendor/whisper.cpp/build/bin/whisper-cli";

export const WHISPER_MODEL = "vendor/whisper.cpp/models/ggml-tiny.en.bin";
