import { requireEnv } from "../../voice/utils/env_guard.mjs";
// pseudo_self_training.mjs — Token-Safe Trainer with Debug Output
import { readFile } from 'fs/promises';
import path from 'path';

export async function trainFromMemory() {
  const memPath = path.resolve("logs/transcripts/injected_memory.log");
  const refsPath = path.resolve("logs/evolution/reflections.log");

  const mem = await readFile(memPath, "utf-8").catch(() => "");
  const refs = await readFile(refsPath, "utf-8").catch(() => "");

  const full = `MEMORY:\n${mem}\n\nREFLECTIONS:\n${refs}`;

  // ✅ Debug block
  console.log("⚠️  TRAIN FROM MEMORY RUNNING");
  console.log("📏 Full memory+reflection length:", full.length);

  // ⛔ Safety limiter: ~24,000 characters = ~8,000 tokens
  const maxChars = 24000;
  const digest = full.length > maxChars ? full.slice(-maxChars) : full;

  console.log("📎 Trimmed to:", digest.length, "chars");

  return digest;
}