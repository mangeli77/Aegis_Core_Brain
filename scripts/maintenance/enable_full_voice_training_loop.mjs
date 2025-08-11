import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/maintenance/enable_full_voice_training_loop.mjs

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const base = path.resolve();
const loopScript = 'scripts/maintenance/run_voice_training_loop.mjs';
const loopPath = path.join(base, loopScript);
const logPath = path.join(base, 'logs/cron_voice_training.log');

const cronJob = `0 4 * * * /opt/homebrew/bin/node ${loopPath} >> ${logPath} 2>&1`;

function ensureDailyLoopScript() {
  const content = `// ${loopScript}

import { speak } from '../../voice/utils/elevenlabs_tts.mjs';
import { execSync } from 'child_process';

async function run() {
  console.log('🌀 Running full voice training loop...');

  try {
    execSync('node scripts/patches/self_teach_patch.mjs', { stdio: 'inherit' });
    execSync('node scripts/maintenance/self_teach_voice_patch.mjs', { stdio: 'inherit' });
    await speak('Voice training summary and memory injection complete.');
    console.log('✅ Voice training loop finished.');
  } catch (err) {
    console.error('❌ Loop failed:', err);
  }
}

await run();
`;

  fs.writeFileSync(loopPath, content, 'utf-8');
  console.log(`✅ Created: ${loopPath}`);
}

function scheduleCronJob() {
  try {
    const existing = execSync('crontab -l', { encoding: 'utf-8' });
    if (existing.includes(loopScript)) {
      console.log('⏳ Cron job already exists. Skipping.');
      return;
    }
    const updated = `${existing.trim()}\n${cronJob}\n`;
    const tmp = path.join(base, 'tmp_crontab.txt');
    fs.writeFileSync(tmp, updated);
    execSync(`crontab ${tmp}`);
    fs.unlinkSync(tmp);
    console.log('📅 Daily cron job added.');
  } catch (err) {
    console.warn('⚠️ Could not schedule cron job automatically. You may need to add it manually:');
    console.warn(cronJob);
  }
}

console.log('\n🚀 Enabling full voice training loop...');
ensureDailyLoopScript();
scheduleCronJob();
console.log('\n✅ Voice training system is ready for autonomous execution.');
