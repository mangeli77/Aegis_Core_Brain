import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/patches/self_teach_patch.mjs

import fs from 'fs';
import path from 'path';

const memoryDir = path.resolve('./logs/transcripts_curated');
const summaryFile = path.resolve('./core/memory/Reflection/self_teaching_summary.md');
const backupDir = path.resolve('./logs/transcripts_backup');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function scoreLine(line) {
  const emotional = /(i feel|i think|i need|i want|it hurts|i miss|i remember|i wish)/i;
  const structural = /(identity|purpose|mission|autonomy|memory|evolve|teach|reflect|build)/i;
  const lengthScore = line.length > 100 ? 1 : 0;

  return (
    (emotional.test(line) ? 2 : 0) +
    (structural.test(line) ? 2 : 0) +
    lengthScore
  );
}

function scanAndSummarizeMemory() {
  ensureDir(backupDir);
  const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('.txt'));
  const summary = [];

  for (const file of files) {
    const fullPath = path.join(memoryDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    const strongLines = lines
      .map(line => ({ line, score: scoreLine(line) }))
      .filter(item => item.score >= 2)
      .map(item => `• ${item.line.trim()}`);

    if (strongLines.length > 0) {
      summary.push(`### ${file}\n${strongLines.join('\n')}\n`);
      fs.copyFileSync(fullPath, path.join(backupDir, file));
    }
  }

  fs.writeFileSync(summaryFile, summary.join('\n'), 'utf-8');
  console.log(`🧠 Self-teach summary saved to: ${summaryFile}`);
}

scanAndSummarizeMemory();