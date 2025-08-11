import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/fixes/verify_elevenlabs_setup.mjs

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const envPath = path.resolve('.env');
const utilsPath = path.resolve('./voice/utils/elevenlabs_tts.mjs');
const testPath = path.resolve('./scripts/test/test_elevenlabs_tts_direct.mjs');

const VOICE_ID = process.env.ELEVENLABS_VOICE;
const API_KEY = process.env.ELEVENLABS_KEY;

function checkEnv() {
  const missing = [];
  if (!fs.existsSync(envPath)) return '❌ .env file is missing.';
  if (!API_KEY) missing.push('ELEVENLABS_KEY');
  if (!VOICE_ID) missing.push('ELEVENLABS_VOICE');
  return missing.length
    ? `⚠️ Missing env keys: ${missing.join(', ')}`
    : '✅ .env contains ElevenLabs KEY and VOICE ID';
}

function fixImportPath() {
  if (!fs.existsSync(testPath)) return '❌ test script not found.';
  let content = fs.readFileSync(testPath, 'utf-8');
  const incorrect = `from '../../utils/elevenlabs_tts.mjs'`;
  const correct = `from '../../voice/utils/elevenlabs_tts.mjs'`;
  if (content.includes(incorrect)) {
    content = content.replace(incorrect, correct);
    fs.writeFileSync(testPath, content);
    return '🔧 Fixed import path in test script.';
  } else if (content.includes(correct)) {
    return '✅ Import path already correct.';
  } else {
    return '⚠️ Could not determine import path status.';
  }
}

function checkDotenvUsage() {
  if (!fs.existsSync(utilsPath)) return '❌ elevenlabs_tts.mjs not found.';
  const content = fs.readFileSync(utilsPath, 'utf-8');
  const hasDotenv = content.includes("dotenv.config()");
  return hasDotenv
    ? '✅ dotenv is loaded in elevenlabs_tts.mjs'
    : '⚠️ dotenv is NOT being loaded — add `import dotenv from \"dotenv\"; dotenv.config();`';
}

console.log('\u2728 Verifying ElevenLabs Setup...');
console.log(checkEnv());
console.log(fixImportPath());
console.log(checkDotenvUsage());
console.log('✅ Done. You may now re-run: node scripts/test/test_elevenlabs_tts_direct.mjs');
