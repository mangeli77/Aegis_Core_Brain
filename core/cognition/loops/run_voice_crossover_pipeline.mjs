import { requireEnv } from '../../voice/utils/env_guard.mjs';
// cognition/loops/run_voice_crossover_pipeline.mjs

import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// === Module Imports ===
import { linkVoiceToMemory } from '../learning/link_voice_to_memory.mjs';
import { reflectOnToneMismatch } from '../learning/reflect_on_failed_tone.mjs';
import { runSelfTest } from '../learning/self_test_emotion_synthesis.mjs';

// === Voice-Cognition Crossover Pipeline ===
async function runVoiceCrossoverPipeline() {
  console.log('🧠 Launching voice-to-cognition crossover pipeline...');

  try {
    console.log('\n🔗 Linking voice logs to memory...');
    await linkVoiceToMemory();
    console.log('✅ Memory linked with tone-tagged voice annotations.');

    console.log('\n🧠 Reflecting on failed tone synthesis...');
    await reflectOnToneMismatch();
    console.log('✅ Reflection complete. Emotional misfires logged.');

    console.log('\n🤖 Running emotional self-test...');
    await runSelfTest();
    console.log('✅ Emotional variation self-test complete.');

    console.log('\n🏁 Voice-cognition crossover pipeline complete.');
  } catch (err) {
    console.error('❌ Voice-cognition pipeline failed:', err);
  }
}

runVoiceCrossoverPipeline();