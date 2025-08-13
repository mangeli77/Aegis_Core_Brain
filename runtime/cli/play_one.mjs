#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

// Import your synth entrypoint (already present in your repo)
import { synth as tts } from '../../core/voice/synth/index.mjs';

// Text to say; output file
const text = process.argv.slice(2).join(' ') || 'Aegis online.';
const out  = '/tmp/aegis_one.mp3';

try {
  const buf = await tts(text, { output_format: 'mp3_44100_128' });
  fs.writeFileSync(out, buf);
  console.log(JSON.stringify({ ok: true, bytes: buf?.length ?? 0, out }, null, 2));

  // Best-effort playback (macOS 'afplay' or ffmpeg 'ffplay')
  try {
    execSync(`afplay "${out}"`, { stdio: 'ignore' });
  } catch {
    try {
      execSync(`ffplay -nodisp -autoexit "${out}"`, { stdio: 'ignore' });
    } catch {}
  }
} catch (e) {
  console.error(JSON.stringify({ ok: false, error: String(e?.message || e) }, null, 2));
  process.exit(1);
}
