#!/usr/bin/env node
import fs from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = process.argv[2] || 'core/voice/output/train/high_confidence';
if (!fs.existsSync(dir)) {
  console.error('❌ Directory not found:', dir);
  process.exit(1);
}

const wavs = fs.readdirSync(dir)
  .filter(f => f.toLowerCase().endsWith('.wav'))
  .map(f => join(dir, f));

if (!wavs.length) {
  console.error('⚠ No .wav files found in', dir);
  process.exit(1);
}

const pick = wavs[Math.floor(Math.random() * wavs.length)];
console.log('▶ Playing:', pick);

const player = process.env.AUDIO_PLAYER || 'afplay';
const r = spawnSync(player, [pick], { stdio: 'inherit' });
process.exit(r.status ?? 0);
