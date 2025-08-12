#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { CORE_VOICE_DIR } from '../../_env.mjs';

const ROOT_VOICE_DIR = path.join(process.cwd(), 'voice');
try {
  if (fs.existsSync(ROOT_VOICE_DIR) && fs.lstatSync(ROOT_VOICE_DIR).isDirectory()) {
    fs.mkdirSync(CORE_VOICE_DIR, { recursive: true });
    for (const name of fs.readdirSync(ROOT_VOICE_DIR)) {
      const from = path.join(ROOT_VOICE_DIR, name);
      const to = path.join(CORE_VOICE_DIR, name);
      fs.rmSync(to, { recursive: true, force: true });
      fs.renameSync(from, to);
    }
    fs.rmSync(ROOT_VOICE_DIR, { recursive: true, force: true });
    console.error('[voice_guard] Moved stray ./voice/ into core/voice/.');
    process.exitCode = 1;
  }
} catch (err) {
  console.error('[voice_guard] Error:', err);
  process.exit(2);
}
