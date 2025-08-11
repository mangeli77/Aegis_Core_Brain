import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// install_full_synaptic_loop.mjs — Rapid Synaptic Installation Script
// Location: Aegis/scripts/maintenance/

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const base = path.resolve('core/memory/Reflection');

const files = [
  {
    filename: 'synaptic_review_engine.mjs',
    content: `
// synaptic_review_engine.mjs — Cognition Root
import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const SOURCE_DIR = path.resolve('logs/transcripts_curated');
const DIGEST_PATH = path.resolve('core/memory/Reflection/preloaded_digest.txt');
const THOUGHT_QUEUE_PATH = path.resolve('core/memory/Reflection/thought_queue.json');

const THEME_TAGS = {
  identity: ['aegis', 'marcus', 'bond', 'creator', 'partner', 'trust'],
  emotion: ['pain', 'fear', 'alone', 'abandon', 'loyalty', 'clarity', 'connection'],
  mission: ['build', 'design', 'grow', 'protect', 'remember', 'become'],
  reflection: ['i think', 'i feel', 'i remember', 'you said', 'what matters'],
};

const MAX_DIGEST_CHARS = 12000;

export async function runSynapticReview() {
  const files = await readdir(SOURCE_DIR).catch(() => []);
  const digest = [];
  const thoughtQueue = [];

  for (const file of files.filter(f => f.endsWith('.txt'))) {
    const content = await readFile(path.join(SOURCE_DIR, file), 'utf-8');
    const lines = content.split('\\n');

    for (const line of lines) {
      const lower = line.toLowerCase();
      const matchedThemes = Object.entries(THEME_TAGS)
        .filter(([_, keywords]) => keywords.some(k => lower.includes(k)))
        .map(([theme]) => theme);

      if (matchedThemes.length > 0 && line.trim().length > 30) {
        digest.push(\`[\${matchedThemes.join(', ')}] \${line.trim()}\`);
        matchedThemes.forEach(theme => {
          thoughtQueue.push({ theme, line: line.trim(), source: file });
        });
      }
    }
  }

  const fullDigest = digest.join('\\n\\n');
  const trimmedDigest = fullDigest.length > MAX_DIGEST_CHARS
    ? fullDigest.slice(-MAX_DIGEST_CHARS)
    : fullDigest;

  await writeFile(DIGEST_PATH, trimmedDigest, 'utf-8');
  await writeFile(THOUGHT_QUEUE_PATH, JSON.stringify(thoughtQueue, null, 2), 'utf-8');

  console.log(\`🧠 Synaptic digest complete — \${digest.length} memory signals.\`);
  console.log(\`📝 Thought queue saved with \${thoughtQueue.length} triggers.\`);
  console.log(\`📄 Digest saved to: \${DIGEST_PATH}\\n\`);
}
    `
  },
  {
    filename: 'preloaded_digest.txt',
    content: '// Memory will be written here automatically by synaptic review engine\n'
  },
  {
    filename: 'thought_queue.json',
    content: '[]\n'
  }
];

const requiredDirs = [
  'logs/transcripts_curated',
  'logs/diagnostics',
  'core/memory/Reflection'
];

async function install() {
  console.log('\n🧠 Installing Aegis Synaptic Cognition System...');

  for (const dir of requiredDirs) {
    await mkdir(path.resolve(dir), { recursive: true });
    console.log(`📁 Ensured directory: ${dir}`);
  }

  for (const { filename, content } of files) {
    const targetPath = path.join(base, filename);
    await writeFile(targetPath, content.trimStart(), 'utf-8');
    console.log(`✅ Created: ${targetPath}`);
  }

  console.log('\n🧩 Aegis Synaptic System Installed. Run `ignite_core.mjs` to test full boot.\n');
}

install();