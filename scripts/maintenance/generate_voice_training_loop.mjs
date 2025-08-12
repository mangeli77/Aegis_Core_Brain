import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/maintenance/generate_voice_training_loop.mjs

import fs from 'fs';
import path from 'path';
import { speak } from "#voice-utils/tts_router.mjs";
import fetch from 'node-fetch';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const RAW_DIR = path.resolve('./cognition/learning/voice/raw_scripts');
const SUMMARY_LOG = path.resolve('./core/memory/Reflection/voice_training_autosummary.md');
const OUTPUT_PATH = path.resolve('./core/voice/output');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitize(text) {
  return text
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function fetchPrompt() {
  const urls = [
    'https://api.quotable.io/quotes/random?limit=1',
    'https://type.fit/api/quotes',
    'https://zenquotes.io/api/random'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (Array.isArray(json)) {
        return sanitize(json[0].text || json[0].q || json[0].quote || '');
      } else if (typeof json === 'object') {
        return sanitize(json.content || json.quote || '');
      }
    } catch (err) {
      console.warn('⚠️ Failed to fetch from:', url);
    }
  }

  return 'Your silence is your soul speaking.';
}

async function delayRandom(seconds = 60) {
  const delay = Math.floor(Math.random() * seconds * 1000);
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function generateTrainingLine() {
  const timestamp = new Date().toISOString();
  const prompt = await fetchPrompt();

  const filename = `line_${timestamp.replace(/[:.]/g, '-')}.txt`;
  const rawPath = path.join(RAW_DIR, filename);

  fs.writeFileSync(rawPath, prompt, 'utf-8');
  await speak(prompt);

  const summaryLine = `- ${timestamp}: \`${prompt}\``;
  fs.appendFileSync(SUMMARY_LOG, summaryLine + '\n');

  console.log('✅ Voice training prompt generated and spoken.');
}

ensureDir(RAW_DIR);
ensureDir(OUTPUT_PATH);

(async () => {
  await delayRandom(60); // avoid robotic cron timing
  generateTrainingLine();
})();