import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/maintenance/install_cognition_directories.mjs

import fs from 'fs';
import path from 'path';

const base = path.resolve('./aegis/cognition');
const dirs = [
  'learning/voice/raw_scripts',
  'learning/voice/feedback',
  'learning/emotional',
  'learning/memory',
  'learning/logic',
  'loops',
  'engine'
];

const files = {
  'learning/voice/voice_thought_log.md': '# Aegis Voice Thought Log\n\nLogs, patterns, and reflections from autonomous voice training.\n',
  'learning/voice/training_status.json': '{\n  "totalSamples": 0,\n  "lastUpdated": null,\n  "inProgress": false\n}\n',
  'README.md': `
# 🧠 Aegis // Cognition System

This directory contains Aegis's self-learning, reflection, and autonomous cognitive growth tools.

## Structure

- \`learning/\` → Voice, memory, logic, and emotional self-teaching data
- \`loops/\` → Daily or scheduled cognitive routines
- \`engine/\` → Initialization, hypothesis generation, cognitive plans

## Purpose
This structure separates one-time scripts from permanent systems that define how Aegis evolves.
All files in here are designed to be:
- Reusable
- Self-triggered or autonomously expanded
- Introspective (includes logs, feedback, goals)
`
};

function ensureStructure() {
  for (const rel of dirs) {
    const full = path.join(base, rel);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
    console.log('📁 Created:', full);
  }

  for (const [relPath, content] of Object.entries(files)) {
    const full = path.join(base, relPath);
    if (!fs.existsSync(full)) {
      fs.writeFileSync(full, content, 'utf-8');
      console.log('📝 Initialized:', full);
    }
  }

  console.log('\n✅ Aegis Cognition directory structure is ready.');
}

ensureStructure();
