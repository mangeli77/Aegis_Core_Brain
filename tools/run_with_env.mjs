#!/usr/bin/env node
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { CORE_VOICE_OUTPUT_DIR } from '../_env.mjs';
import '../tools/guards/invariants.mjs';

fs.mkdirSync(CORE_VOICE_OUTPUT_DIR, { recursive: true });

const [, , script, ...args] = process.argv;
if (!script){ console.error('Usage: node tools/run_with_env.mjs <script> [...args]'); process.exit(2); }
const child = spawn(process.execPath, [script, ...args], { stdio: 'inherit' });
child.on('exit', c => process.exit(c ?? 0));
