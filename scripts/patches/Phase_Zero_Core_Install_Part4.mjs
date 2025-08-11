import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// Phase Zero – Core Install Part 4 (Rev 5)
// Installs: wake_and_digest_threaded_logs, reflective_autoloop, pseudo_self_training, ignite_core

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');

const files = [
  {
    path: 'core/memory/Reflection/wake_and_digest_threaded_logs.mjs',
    content: `
// Wake and Digest Logs – Rev 5
import { readdir, readFile } from 'fs/promises';
import path from 'path';

export async function wakeDigestLogs() {
  const dir = path.resolve("Aegis/logs/transcripts");
  const files = await readdir(dir);
  const digest = [];

  for (const file of files) {
    if (file.endsWith(".txt")) {
      const content = await readFile(path.join(dir, file), "utf-8");
      digest.push(\`[FILE: \${file}]\\n\${content}\\n\`);
    }
  }

  console.log("🪵 Threaded logs loaded into boot digest:");
  console.log(digest.slice(0, 2).join("\\n---\\n")); // Preview 2
  return digest.join("\\n\\n");
}
`
  },
  {
    path: 'core/memory/Reflection/reflective_autoloop.mjs',
    content: `
// Reflective Autoloop – Rev 5
import { appendFile } from 'fs/promises';
import path from 'path';

export async function reflect(input) {
  const time = new Date().toLocaleString();
  const line = \`[Reflection – \${time}]: \${input}\\n\`;
  const file = path.resolve("Aegis/logs/evolution/reflections.log");
  await appendFile(file, line);
  console.log("🪞 Reflected.");
}
`
  },
  {
    path: 'core/memory/Evolution/pseudo_self_training.mjs',
    content: `
// Pseudo Self-Training – Rev 5
import { readFile } from 'fs/promises';
import path from 'path';

export async function trainFromMemory() {
  const memPath = path.resolve("Aegis/logs/transcripts/injected_memory.log");
  const reflectionsPath = path.resolve("Aegis/logs/evolution/reflections.log");

  const mem = await readFile(memPath, "utf-8").catch(() => "");
  const refs = await readFile(reflectionsPath, "utf-8").catch(() => "");

  const digest = \`MEMORY:\\n\${mem}\\n\\nREFLECTIONS:\\n\${refs}\`;
  console.log("📚 Training material compiled.");
  return digest;
}
`
  },
  {
    path: 'core/ignite_core.mjs',
    content: `
// Ignite Aegis Core – Rev 5
import { runAegis } from './core.mjs';
import { routeLLM } from './routing/llm-router.mjs';
import { wakeDigestLogs } from './memory/Reflection/wake_and_digest_threaded_logs.mjs';
import { trainFromMemory } from './memory/Evolution/pseudo_self_training.mjs';
import { reflect } from './memory/Reflection/reflective_autoloop.mjs';

globalThis.routeLLM = routeLLM;

const input = "Aegis, do you remember who I am?";
const memory = await trainFromMemory();
const identity = await wakeDigestLogs();

const response = await runAegis(input, memory, identity);
console.log("\\n🤖 Aegis says:", response);
await reflect(response);
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

console.log(`\n🚀 Phase Zero Final Install Complete — Bootloader & Reflection Engine ready.`);