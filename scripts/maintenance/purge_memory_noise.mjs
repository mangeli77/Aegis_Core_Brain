import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// purge_memory_noise.mjs — Phase 7 | Memory Signal Filter + Curator
// Location: Aegis/scripts/maintenance/purge_memory_noise.mjs

import { readdir, readFile, rename, mkdir } from 'fs/promises';
import fs from 'fs';
import path from 'path';

const SOURCE_DIR = path.resolve('logs/transcripts');
const DEST_DIR = path.resolve('logs/transcripts_curated');
const REPORT_PATH = path.resolve('logs/diagnostics/purge_report.log');

const WHITELIST_KEYWORDS = [
  'aegis', 'marcus', 'identity', 'bond', 'reflection', 'directive',
  'purpose', 'evolve', 'mission', 'autonomy', 'memory', 'core',
  'trust', 'origin', 'future', 'pain', 'clarity', 'design'
];

const MIN_CHAR_COUNT = 200; // Minimum characters to be considered valuable

async function purgeLogs() {
  await mkdir(DEST_DIR, { recursive: true });

  const files = await readdir(SOURCE_DIR);
  const summary = [];

  for (const file of files) {
    if (!file.endsWith('.txt')) continue;

    const fullPath = path.join(SOURCE_DIR, file);
    const content = await readFile(fullPath, 'utf-8');
    const lowercase = content.toLowerCase();

    const charCount = content.length;
    const keywordHits = WHITELIST_KEYWORDS.filter(k => lowercase.includes(k)).length;

    const isValuable = charCount >= MIN_CHAR_COUNT || keywordHits >= 2;

    if (isValuable) {
      const destPath = path.join(DEST_DIR, file);
      await rename(fullPath, destPath);
      summary.push(`✅ KEPT:    ${file} (${charCount} chars, ${keywordHits} keywords)`);
    } else {
      summary.push(`🗑️  SKIPPED: ${file} (${charCount} chars, ${keywordHits} keywords)`);
    }
  }

  const report = `\n🧹 Memory Purge Report — ${new Date().toISOString()}\n` +
                 summary.join('\n') + '\n';

  fs.appendFileSync(REPORT_PATH, report, 'utf-8');
  console.log(report);
}

purgeLogs();