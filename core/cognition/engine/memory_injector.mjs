import { requireEnv } from '../../voice/utils/env_guard.mjs';
// cognition/engine/memory_injector.mjs

import fs from 'fs';
import path from 'path';

/**
 * Injects a memory entry into a memory log file.
 * @param {string} type - The type/category of the memory.
 * @param {string} content - The memory content to store.
 * @param {string} [source='system'] - Optional origin/source label.
 */
export function injectMemory(type, content, source = 'system') {
  const timestamp = new Date().toISOString();
  const memoryLine = `- ${timestamp} [${type.toUpperCase()}] (${source}): ${content}`;

  const MEMORY_LOG_PATH = path.resolve(`core/memory/Reflection/memory_log_${type}.md`);

  try {
    fs.appendFileSync(MEMORY_LOG_PATH, memoryLine + '\n');
    console.log(`✅ Memory injected into ${MEMORY_LOG_PATH}`);
  } catch (err) {
    console.error('❌ Failed to inject memory:', err);
  }
}
