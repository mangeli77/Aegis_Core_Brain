import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/maintenance/archive_excess_prompts.mjs

import fs from 'fs';
import path from 'path';

const MAX_PROMPTS = 200;
const ROOT = 'voice/wav_training';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function archiveOldest(folder) {
  const files = fs.readdirSync(folder)
    .filter(f => f.endsWith('.txt'))
    .map(f => f.replace('.txt', ''))
    .sort((a, b) => {
      const aTime = fs.statSync(path.join(folder, `${a}.txt`)).ctime;
      const bTime = fs.statSync(path.join(folder, `${b}.txt`)).ctime;
      return aTime - bTime;
    });

  if (files.length <= MAX_PROMPTS) return `✅ ${files.length} prompts: OK`;

  const excess = files.length - MAX_PROMPTS;
  const archive = path.join(folder, 'archive');
  ensureDir(archive);

  for (let i = 0; i < excess; i++) {
    const base = files[i];
    for (const ext of ['.txt', '.mp3']) {
      const src = path.join(folder, `${base}${ext}`);
      const dst = path.join(archive, `${base}${ext}`);
      if (fs.existsSync(src)) fs.renameSync(src, dst);
    }
  }

  return `📦 Archived ${excess} prompt pairs`;
}

function main() {
  const folders = fs.readdirSync(ROOT).filter(f => fs.statSync(path.join(ROOT, f)).isDirectory());
  for (const folder of folders) {
    const fullPath = path.join(ROOT, folder);
    const result = archiveOldest(fullPath);
    console.log(`${folder.padEnd(14)} → ${result}`);
  }
}

main();