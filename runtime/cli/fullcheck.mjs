import 'dotenv/config';
import { execSync } from 'node:child_process';

const run = (cmd, name) => {
  try {
    const out = execSync(cmd, { stdio: ['ignore','pipe','pipe'] }).toString();
    return { ok: true, name, cmd, out: out.trim() };
  } catch (e) {
    return { ok: false, name, cmd, err: e.stderr?.toString() || e.message };
  }
};

const steps = [
  { name: 'voice:test',   cmd: 'npm run -s voice:test' },       // emits mp3 via say.mjs
  { name: 'health',       cmd: 'npm run -s health' },           // env flags + VOICE_MODE
  { name: 'voice:smoke',  cmd: 'npm run -s voice:smoke' },      // synth smoke JSON
  { name: 'smoke:runtime',cmd: 'npm run -s smoke:runtime' },    // invariants / runtime
];

const results = steps.map(s => run(s.cmd, s.name));
const ok = results.every(r => r.ok);

process.stdout.write(JSON.stringify({
  ok,
  stage: 'full-voice-pipeline',
  results
}, null, 2) + '\n');

process.exit(ok ? 0 : 1);
