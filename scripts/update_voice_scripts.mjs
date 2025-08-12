import fs from 'node:fs';

const P = 'package.json';
const j = JSON.parse(fs.readFileSync(P, 'utf8'));
j.scripts ||= {};

j.scripts['voice:auto']          = 'node jobs/auto_voice_loop.mjs';
j.scripts['voice:sample:high']   = 'node scripts/voice_play_one.mjs core/voice/output/train/high_confidence';
j.scripts['voice:sample:reject'] = 'node scripts/voice_play_one.mjs core/voice/output/train/rejects';
j.scripts['voice:loop:high']     = 'SLEEP=5 node scripts/voice_loop_dir.mjs core/voice/output/train/high_confidence';
j.scripts['voice:loop:reject']   = 'SLEEP=5 node scripts/voice_loop_dir.mjs core/voice/output/train/rejects';
j.scripts['voice:loop:mixed']    =
  "node -e \"const {readdirSync}=require('fs');const {join}=require('path');const {spawnSync}=require('child_process');" +
  "const A='core/voice/output/train/high_confidence',B='core/voice/output/train/rejects';const S=+(process.env.SLEEP||5);" +
  "function pick(D){const f=readdirSync(D).filter(x=>x.endsWith('.wav'));if(!f.length)return null;return join(D,f[Math.floor(Math.random()*f.length)]);} " +
  "function play(){const D=Math.random()<0.5?A:B;const p=pick(D);if(!p){console.error('no wav');process.exit(1)}console.log('▶',p);spawnSync('afplay',[p],{stdio:'inherit'})} " +
  "play();setInterval(play,S*1000);process.stdin.resume();\"";

fs.writeFileSync(P, JSON.stringify(j, null, 2));
console.log('✅ package.json scripts updated');
