#!/usr/bin/env node
import fs from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = process.argv[2] || 'core/voice/output/train/high_confidence';
const SLEEP = Math.max(1, Number(process.env.SLEEP || 5));
const player = process.env.AUDIO_PLAYER || 'afplay';

function listWavs() {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith('.wav'))
    .map(f => join(dir, f));
}

function playOne() {
  const wavs = listWavs();
  if (!wavs.length) {
    console.error('⚠ No .wav files in', dir);
    return false;
  }
  const pick = wavs[Math.floor(Math.random() * wavs.length)];
  console.log('▶ Playing:', pick);
  const r = spawnSync(player, [pick], { stdio: 'inherit' });
  return (r.status ?? 0) === 0;
}

let stopped = false;
process.on('SIGINT', () => { stopped = true; console.log('\n⏹️  Stopped'); process.exit(0); });

(async () => {
  while (!stopped) {
    playOne();
    await new Promise(res => setTimeout(res, SLEEP * 1000));
  }
})();
