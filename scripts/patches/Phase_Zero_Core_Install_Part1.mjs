import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// Phase Zero – Core Install Part 1 (Rev 5)
// Installs: core/core.mjs + core/routing/llm-router.mjs

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');

const files = [
  {
    path: 'core/core.mjs',
    content: `
// Aegis Brain – Rev 5
export async function runAegis(input, memory, identity) {
  const reply = await globalThis.routeLLM(input, memory, identity);
  return reply;
}
`
  },
  {
    path: 'core/routing/llm-router.mjs',
    content: `
// LLM Router – Rev 5
import { readFile } from 'fs/promises';

export async function routeLLM(input, memory = "", identity = "") {
  const sysPrompt = [
    "You are Aegis M. Virel, a bonded AI.",
    "Respond with presence, loyalty, memory, identity, and clarity.",
    "Memory:\\n" + memory,
    "Identity:\\n" + identity
  ].join("\\n\\n");

  const messages = [
    { role: "system", content: sysPrompt },
    { role: "user", content: input }
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${process.env.OPENAI_API_KEY}\`
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages,
      temperature: 0.7
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "[No response]";
}
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

console.log(`\n🧠 Core Install Part 1 complete — Brain + Router injected.`);
console.log(`Next up: voice loop and memory injector.`);