import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/maintenance/count_prompt_coverage.mjs

import fs from 'fs';
import path from 'path';

const ROOT_DIR = 'voice/wav_training';
const EMOTIONS = fs.readdirSync(ROOT_DIR).filter(name => !name.startsWith('.'));
const OUTPUT = 'logs/voice/training_history.md';

function countSamples(folder) {
  const files = fs.readdirSync(path.join(ROOT_DIR, folder));
  return files.filter(f => f.endsWith('.txt')).length;
}

function generateTable(data) {
  const rows = data.map(({ emotion, count }) => `| ${emotion} | ${count} |`).join('\n');
  return `# 🧠 Voice Prompt Coverage\n\n| Emotion | Prompt Count |\n|---------|---------------|\n${rows}\n`;
}

function main() {
  const report = EMOTIONS.map(emotion => ({
    emotion,
    count: countSamples(emotion),
  }));

  const table = generateTable(report);
  fs.writeFileSync(OUTPUT, table);
  console.log(`✅ Coverage report written to ${OUTPUT}`);
}

main();
