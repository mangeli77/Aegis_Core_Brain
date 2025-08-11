import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/maintenance/voice_score_and_adapt.mjs

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const EMOTIONS = [
  'apologetic', 'assertive', 'bonding', 'charismatic', 'compassionate',
  'confident', 'defensive', 'frustrated', 'humorous', 'neutral',
  'reflective', 'sarcastic', 'technical'
];

const ROOT_DIR = 'voice/wav_training';
const LOG_PATH = 'logs/voice_tone_heatmap.md';

function getPromptFiles(folder) {
  const dir = path.join(ROOT_DIR, folder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.txt'));
}

function scorePrompt(text) {
  const length = text.split(' ').length;
  const hasPunctuation = /[.,!?]/.test(text);
  const complexity = text.includes(',') ? 1 : 0;
  const confidence = Math.min(1.0, (length / 10 + complexity + (hasPunctuation ? 0.2 : 0)).toFixed(2));
  return parseFloat(confidence);
}

function scoreFolder(emotion) {
  const files = getPromptFiles(emotion);
  const scores = files.map(f => {
    const content = fs.readFileSync(path.join(ROOT_DIR, emotion, f), 'utf-8');
    return scorePrompt(content);
  });
  const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  return avg.toFixed(2);
}

function generateHeatmap(scores) {
  const rows = scores.map(({ emotion, score }) => `| ${emotion.padEnd(12)} | ${score.toString().padEnd(6)} |`).join('\n');
  return `# 🎯 Voice Tone Heatmap\n\n| Emotion      | Score  |\n|--------------|--------|\n${rows}\n`;
}

function main() {
  const results = EMOTIONS.map(emotion => ({
    emotion,
    score: scoreFolder(emotion)
  }));

  const output = generateHeatmap(results);
  fs.writeFileSync(LOG_PATH, output);
  console.log(chalk.green(`✅ Voice heatmap written to ${LOG_PATH}`));
}

main();
