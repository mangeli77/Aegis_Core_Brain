import { requireEnv } from "#voice-utils/env_guard.mjs";
// scripts/maintenance/generate_variation_prompts.mjs

import fs from 'fs';
import path from 'path';

const VARIATION_DIR = path.resolve('core/voice/output/variation_tests');
const PLACEHOLDER_TEXT = 'This is a placeholder line for emotional variation.';

function ensurePromptFile(folderPath) {
  const promptPath = path.join(folderPath, 'prompt.txt');

  if (!fs.existsSync(promptPath)) {
    fs.writeFileSync(promptPath, PLACEHOLDER_TEXT);
    console.log(`✅ Created prompt.txt in ${folderPath}`);
  } else {
    console.log(`📄 prompt.txt already exists in ${folderPath}`);
  }
}

function generatePrompts() {
  const folders = fs.readdirSync(VARIATION_DIR).filter(f => f.startsWith('line_'));

  folders.forEach(folder => {
    const folderPath = path.join(VARIATION_DIR, folder);
    if (fs.statSync(folderPath).isDirectory()) {
      ensurePromptFile(folderPath);
    }
  });

  console.log('\n✅ Variation prompts generated.');
}

generatePrompts();
