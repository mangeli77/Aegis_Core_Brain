#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import readline from 'node:readline';
import { spawn, spawnSync } from 'node:child_process';
import { synth } from '../core/voice/synth/index.mjs';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

const WHISPER_BIN = process.env.WHISPER_BIN || './vendor/whisper.cpp/main';
const MODEL_PATH  = process.env.WHISPER_MODEL_PATH || '';
const TMP         = '/tmp';
const WAV         = `${TMP}/aegis_turn.wav`;
const TXT_BASE    = `${TMP}/aegis_turn_out`;
const TXT         = `${TXT_BASE}.txt`;

function startRecording(outWav) {
  if (spawnSync('which', ['rec']).status === 0) {
    return spawn('rec', [outWav, 'channels', '1', 'rate', '16000', 'bit', '16'], { stdio: 'inherit' });
  }
  if (spawnSync('which', ['ffmpeg']).status === 0) {
    return spawn('ffmpeg', ['-hide_banner','-loglevel','error','-f','avfoundation','-i',':0','-ac','1','-ar','16000','-y', outWav], { stdio: 'inherit' });
  }
  throw new Error('Neither sox nor ffmpeg available for recording.');
}
function runWhisper(wav, base, model) {
  if (!model) throw new Error('WHISPER_MODEL_PATH is not set.');
  const args = ['-m', model, '-f', wav, '-otxt', '-of', base];
  const r = spawnSync(WHISPER_BIN, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`whisper.cpp failed (code ${r.status})`);
}

async function main() {
  console.log('\nAegis voice loop ready.');
  console.log('Press <Enter> to record, <Enter> again to stop. Type "q" + <Enter> to quit.\n');
  for (;;) {
    const cmd = await ask('> ');
    if (cmd.trim().toLowerCase() === 'q') break;
    console.log('Recording... (press <Enter> to stop)');
    let rec = startRecording(WAV);
    await ask('');
    try { rec.kill('SIGINT'); } catch {}
    console.log('Recording stopped.');
    try { fs.unlinkSync(TXT); } catch {}
    runWhisper(WAV, TXT_BASE, MODEL_PATH);
    if (!fs.existsSync(TXT)) { console.error('No transcript'); continue; }
    const text = fs.readFileSync(TXT, 'utf8').trim();
    console.log(`Transcript: "${text}"`);
    if (!text) continue;
    try {
      const buf = await synth(text);
      const out = '/tmp/aegis_turn_reply.mp3';
      fs.writeFileSync(out, buf);
      try { spawnSync('afplay', [out], { stdio: 'ignore' }); } catch {}
    } catch (e) { console.error('synth error:', e); }
  }
  rl.close(); console.log('Goodbye.');
}
main().catch(e => { console.error(e); process.exit(1); });
