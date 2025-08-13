import fs from 'node:fs';

const needEnv = ['ELEVENLABS_API_KEY','ELEVENLABS_VOICE_ID'];
const missing = needEnv.filter(k => !process.env[k]);
if (missing.length) {
  console.error('missing env:', missing.join(','));
  process.exit(1);
}

const dirs = ['core','adapters','runtime','datasets','logs','vendor'];
const dirState = Object.fromEntries(dirs.map(d => [d, fs.existsSync(d)]));

console.log(JSON.stringify({
  ok: Object.values(dirState).every(Boolean),
  env: Object.fromEntries(needEnv.map(k => [k, !!process.env[k]])),
  dirs: dirState
}, null, 2));
