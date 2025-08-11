import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

export async function wakeDigestLogs() {
  const dir = path.resolve("logs/transcripts");
  const files = await readdir(dir);

  // ✅ Load first 5 files by sort order (identity + profile guaranteed to be first)
  const sorted = files
    .filter(f => f.endsWith(".txt"))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 5);

  const digest = [];

  for (const file of sorted) {
    const content = await readFile(path.join(dir, file), "utf-8");
    digest.push(`[FILE: ${file}]\n${content}`);
  }

  const full = digest.join("\n\n");

  const maxChars = 24000;
  const limited = full.length > maxChars ? full.slice(-maxChars) : full;

  console.log("📁 Digest length:", limited.length, "chars");
  return limited;
}