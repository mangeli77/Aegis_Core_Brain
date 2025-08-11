import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
import '../_env.mjs';

const miss = [];
const need = ['OPENAI_API_KEY', 'ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID'];
for (const k of need) {
  const v = process.env[k] || (k==='ELEVENLABS_API_KEY' ? process.env.ELEVENLABS_KEY : '');
  if (!v || !String(v).trim()) miss.push(k);
}
if (miss.length) {
  console.error('❌ Missing required env:', miss.join(', '));
  console.error('   Edit .env or export them in your shell, then re-run.');
  process.exit(1);
}
console.log('✅ env guard OK');