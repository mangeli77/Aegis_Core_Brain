import { requireEnv } from '../../voice/utils/env_guard.mjs';
// reflective_autoloop.mjs — Final path-corrected

import { appendFile } from 'fs/promises';
import path from 'path';

export async function reflect(input) {
  const time = new Date().toLocaleString();
  const line = `[Reflection – ${time}]: ${input}\n`;
  const file = path.resolve("logs/evolution/reflections.log"); // ✅ Clean path
  await appendFile(file, line);
  console.log("🪞 Reflected.");
}