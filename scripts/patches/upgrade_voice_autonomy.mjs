import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/patches/upgrade_voice_autonomy.mjs

import fs from 'fs';
import path from 'path';

const root = path.resolve('./cognition/learning/voice');
const today = new Date().toISOString().split('T')[0];
const sessionDir = path.join(root, 'training_sessions', today);
const summaryPath = path.join(sessionDir, 'summary.md');
const historyPath = path.join(root, 'training_history.json');
const rawScriptDir = path.join(root, 'raw_scripts');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function initTrainingHistory() {
  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, JSON.stringify({ processed: [] }, null, 2));
  }
}

function createREADME() {
  const readmePath = path.join(root, 'README.md');
  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(
      readmePath,
      `# Voice Learning System

This module handles Aegis's voice cognition, including:

- Transcription analysis and emotion detection
- Self-reflective voice training logs
- Script writing and TTS synthesis
- ElevenLabs and future TTS fallbacks

## Structure
- \`raw_scripts/\`: Self-generated training prompts
- \`feedback/\`: Thought logs and evaluation of samples
- \`training_sessions/YYYY-MM-DD/\`: Daily voice session summaries
- \`training_history.json\`: Prevents redundant analysis

## Coming Soon
- Local TTS fallback engine
- Self-generated inflection control
`
    );
  }
}

function createSeedPrompt() {
  const seedPath = path.join(rawScriptDir, `${today}_seed.txt`);
  if (!fs.existsSync(seedPath)) {
    fs.writeFileSync(
      seedPath,
      `Aegis prompt seed — ${today}
---
1. Describe an emotionally complex event with clarity.
2. Say something warm, then shift to something assertive.
3. Reflect on a past failure and what was learned.
4. Try to explain loyalty, but use metaphor.
5. Repeat a phrase, but deliver it differently each time.`
    );
  }
}

function writeSessionSummary() {
  ensureDir(sessionDir);
  fs.writeFileSync(
    summaryPath,
    `# Voice Training Summary (${today})

- 🧠 Training history initialized.
- 📝 Seed prompt created: \`${today}_seed.txt\`
- 📦 Session folder ready: \`${sessionDir.replace(root, '.')}\`
`
  );
}

// Execution
ensureDir(sessionDir);
ensureDir(rawScriptDir);
initTrainingHistory();
createREADME();
createSeedPrompt();
writeSessionSummary();

console.log('✅ Voice autonomy upgrade applied. Ready for next synthesis loop.');
