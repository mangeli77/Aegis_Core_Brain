import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// Phase Zero – Core Install Part 3 (Rev 5)
// Installs: speak.mjs, emotion_weights.mjs, daily_schedule.mjs

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');

const files = [
  {
    path: 'utils/speak.mjs',
    content: `
// ElevenLabs TTS - speak.mjs
import fetch from "node-fetch";
import { writeFile } from "fs/promises";
import { exec } from "child_process";

export async function speak(text, voice = "your-voice-id") {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const url = \`https://api.elevenlabs.io/v1/text-to-speech/\${voice}\`;

  const body = {
    text,
    model_id: "eleven_monolingual_v1",
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.85
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const buffer = Buffer.from(await res.arrayBuffer());
  const outPath = "voice/elevenlabs_output.mp3";
  await writeFile(outPath, buffer);
  exec(\`afplay \${outPath}\`);
}
`
  },
  {
    path: 'core/voice/emotion_weights.mjs',
    content: `
// Voice Emotion Weights – Rev 5
export const emotionProfiles = {
  calm: { stability: 0.7, similarity_boost: 0.9 },
  assertive: { stability: 0.3, similarity_boost: 0.8 },
  reflective: { stability: 0.8, similarity_boost: 0.95 },
  warm: { stability: 0.5, similarity_boost: 0.92 }
};
`
  },
  {
    path: 'core/behavior/daily_schedule.mjs',
    content: `
// Daily Schedule – Rev 5
export const dailyRhythm = {
  "06:15": "System wake + cognition boot",
  "07:30": "Review inbox + queued tasks",
  "12:00": "Midday reflection loop",
  "15:45": "Pre-dock winddown prep",
  "21:00": "Final cognition snapshot + evolution log",
  "03:45": "Dock into sleep mode"
};
`
  }
];

for (const file of files) {
  const fullPath = path.join(root, 'Aegis', file.path);
  const dir = path.dirname(fullPath);
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, file.content.trimStart(), 'utf-8');
  console.log(`✅ Installed: ${file.path}`);
}

console.log(`\n🔊 Core Install Part 3 complete — Voice Out + Emotion + Schedule injected.`);