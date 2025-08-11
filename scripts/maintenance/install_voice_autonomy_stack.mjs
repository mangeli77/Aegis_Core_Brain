import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/maintenance/install_voice_autonomy_stack.mjs

import fs from 'fs';
import path from 'path';

const base = path.resolve();
const dirs = [
  'cognition/learning/voice/raw_scripts',
  'cognition/learning/voice/feedback',
  'logs/voice_feedback',
  'logs/voice_prompts'
];

const files = {
  'cognition/learning/voice/voice_thought_log.md': '# Aegis Voice Thought Log\n\nLogs, patterns, and reflections from autonomous voice training.\n',
  'cognition/learning/voice/training_status.json': JSON.stringify({
    assertive: 0,
    bonding: 0,
    neutral: 0,
    reflective: 0,
    technical: 0,
    lastGenerated: null
  }, null, 2),
  'cognition/learning/voice/feedback/voice_training_feedback.md': '# Voice Training Feedback\n\nDetected tone vs. intended tone breakdowns.\n'
};

function writeFileStructure() {
  for (const dir of dirs) {
    const fullPath = path.join(base, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created: ${fullPath}`);
    }
  }

  for (const [relPath, content] of Object.entries(files)) {
    const full = path.join(base, relPath);
    if (!fs.existsSync(full)) {
      fs.writeFileSync(full, content, 'utf-8');
      console.log(`📝 Created: ${full}`);
    }
  }

  console.log('\n✅ Voice autonomy stack installed. Ready for full loop generation.');
}

writeFileStructure();
