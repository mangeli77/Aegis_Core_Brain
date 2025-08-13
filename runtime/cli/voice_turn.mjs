#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { synth as tts } from '../../core/voice/synth/index.mjs';

const REC_WAV = '/tmp/aegis_turn.wav';
const TTS_MP3 = '/tmp/aegis_turn.mp3';

// Optional environment hints
const WHISPER_BIN   = process.env.WHISPER_BIN || 'whisper';
const WHISPER_MODEL = process.env.WHISPER_MODEL_PATH;

// 1) Record a short utterance (macOS: sox or ffmpeg; you may adapt to your setup)
function record() {
  // Try sox first
  try { execFileSync('rec', ['-q', REC_WAV, 'trim', '0', '5']); return; } catch {}
  // Fallback: ffmpeg 5s from default device (tweak as needed)
  try { execFileSync('ffmpeg', ['-y', '-f', 'avfoundation', '-i', ':0', '-t', '5', REC_WAV], { stdio: 'ignore' }); return; } catch {}
  console.error('Recording tool not found (rec/sox or ffmpeg). Skipping record step.');
}

// 2) Transcribe via whisper.cpp (if available)
function transcribe() {
  if (!WHISPER_MODEL) {
    console.error('WHISPER_MODEL_PATH not set; skipping ASR.');
    return '';
  }
  try {
    const out = execFileSync(WHISPER_BIN, ['-m', WHISPER_MODEL, '-f', REC_WAV, '-otxt'], { encoding: 'utf8' });
    // whisper.cpp writes .txt alongside or stdout; attempt to read stdout text
    const txt = out?.toString?.().trim() || '';
    return txt;
  } catch (e) {
    console.error('Whisper ASR failed:', e?.message || e);
    return '';
  }
}

async function main() {
  record();
  const text = transcribe() || 'Acknowledged.';
  const buf = await tts(text, { output_format: 'mp3_44100_128' });
  fs.writeFileSync(TTS_MP3, buf);
  try { execFileSync('afplay', [TTS_MP3], { stdio: 'ignore' }); } catch {
    try { execFileSync('ffplay', ['-nodisp', '-autoexit', TTS_MP3], { stdio: 'ignore' }); } catch {}
  }
  console.log(JSON.stringify({ ok: true, said: text, out: TTS_MP3, bytes: buf?.length ?? 0 }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
