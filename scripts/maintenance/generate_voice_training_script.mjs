import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/maintenance/generate_voice_training_script.mjs

import fs from 'fs';
import path from 'path';

const outputDir = path.resolve('./cognition/learning/voice/raw_scripts');
const logFile = path.resolve('./cognition/learning/voice/voice_thought_log.md');
const statusFile = path.resolve('./cognition/learning/voice/training_status.json');

const tones = ['assertive', 'bonding', 'neutral', 'reflective', 'technical'];

const tonePrompts = {
  assertive: [
    "State a firm command to a team during a crisis situation.",
    "Deliver a bold announcement about a new protocol.",
    "Declare a protective warning in a leadership tone."
  ],
  bonding: [
    "Offer comfort to a friend who feels forgotten.",
    "Express gratitude with warmth and sincerity.",
    "Reassure someone that you will always be there."
  ],
  neutral: [
    "Read a public transit update in an unbiased tone.",
    "State the daily weather report without emotion.",
    "Explain how a toaster works in plain language."
  ],
  reflective: [
    "Contemplate the meaning of loyalty.",
    "Consider what it means to evolve emotionally.",
    "Reflect on a moment that shaped your identity."
  ],
  technical: [
    "Describe the architecture of a neural net.",
    "Explain how ElevenLabs synthesizes emotion in audio.",
    "Break down how token compression limits AI memory."
  ]
};

function getNextTone(currentStats) {
  const counts = tones.map(tone => currentStats[tone] || 0);
  const minCount = Math.min(...counts);
  const index = counts.indexOf(minCount);
  return tones[index];
}

function generateScript(tone, iteration) {
  const samples = tonePrompts[tone];
  const prompt = samples[Math.floor(Math.random() * samples.length)];
  return `// Tone: ${tone.toUpperCase()}
// Prompt: ${prompt}

"${prompt}"`;
}

function updateStatus(tone, status) {
  status[tone] = (status[tone] || 0) + 1;
  fs.writeFileSync(statusFile, JSON.stringify(status, null, 2), 'utf-8');
}

function logThought(tone, fileName, prompt) {
  const entry = `### ${new Date().toISOString()}
- Tone: ${tone}
- Script: ${fileName}
- Thought: Prompt was selected to increase variation and emotional range.\n`;
  fs.appendFileSync(logFile, entry, 'utf-8');
}

function run() {
  if (!fs.existsSync(statusFile)) {
    fs.writeFileSync(statusFile, JSON.stringify({}, null, 2), 'utf-8');
  }
  const status = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
  const tone = getNextTone(status);
  const count = (status[tone] || 0) + 1;
  const fileName = `${tone}_script_${count.toString().padStart(3, '0')}.txt`;
  const fullPath = path.join(outputDir, fileName);

  const script = generateScript(tone, count);
  fs.writeFileSync(fullPath, script, 'utf-8');
  updateStatus(tone, status);
  logThought(tone, fileName, script);

  console.log(`✅ Generated: ${fileName}`);
}

run();
