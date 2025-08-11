import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
/**
 * Injects memory data into the system memory store.
 * @param {object|string} data - The memory data to inject (object or JSON string).
 * @returns {Promise<void>}
 */
export async function injectMemory(data) {
  try {
    // Parse if JSON string
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('injectMemory: Provided data is invalid or not an object');
    }

    // Example: Save to disk or update global memory store
    // (Replace with your real memory handling logic)
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const memoryPath = path.resolve(process.cwd(), 'core/memory/memory_store.json');

    let current = {};
    try {
      const existing = await fs.readFile(memoryPath, 'utf-8');
      current = JSON.parse(existing);
    } catch {
      // File may not exist yet — ignore
    }

    const merged = { ...current, ...parsed };
    await fs.writeFile(memoryPath, JSON.stringify(merged, null, 2), 'utf-8');

    console.log(`✅ injectMemory: Memory successfully updated with ${Object.keys(parsed).length} entries.`);
  } catch (err) {
    console.error('❌ injectMemory failed:', err);
    throw err;
  }
}

// Optional: still support other exports in this module
export default {
  injectMemory
};