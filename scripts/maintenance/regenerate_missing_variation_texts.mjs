import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/maintenance/regenerate_missing_variation_texts.mjs

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('core/voice/output/variation_tests');
const EMOTIONS = [
  'neutral', 'reflective', 'assertive', 'technical', 'bonding',
  'confident', 'defensive', 'compassionate', 'humorous',
  'sarcastic', 'charismatic', 'frustrated', 'apologetic'
];

function regenerateMissingText(lineDir) {
  const promptPath = path.join(lineDir, 'prompt.txt');
  if (!fs.existsSync(promptPath)) return;

  const prompt = fs.readFileSync(promptPath, 'utf-8').trim();

  EMOTIONS.forEach(emotion => {
    const txtPath = path.join(lineDir, `${emotion}_sample.txt`);
    const mp3Path = path.join(lineDir, `${emotion}_sample.mp3`);

    if (fs.existsSync(mp3Path) && !fs.existsSync(txtPath)) {
      fs.writeFileSync(txtPath, prompt);
      console.log(`✅ Created ${emotion}_sample.txt in ${path.basename(lineDir)}`);
    }
  });
}

function main() {
  const lineDirs = fs.readdirSync(ROOT).filter(d => d.startsWith('line_'));

  lineDirs.forEach(folder => {
    const fullPath = path.join(ROOT, folder);
    regenerateMissingText(fullPath);
  });

  console.log('\n✅ All missing .txt files generated.');
}

main();