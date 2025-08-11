import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/maintenance/self_teach_voice_patch.mjs

import fs from 'fs';
import path from 'path';
import { detectEmotionWeights } from '../../core/voice/utils/emotion_weights.mjs';

const rootDir = path.resolve('./voice/wav_training');
const categories = ['assertive', 'bonding', 'neutral', 'reflective', 'technical'];
const outputFile = path.resolve('./core/memory/Reflection/self_teach_voice.md');

function getTranscript(mp3Path) {
  const txtPath = mp3Path.replace(/\.mp3$/, '.txt');
  if (!fs.existsSync(txtPath)) return null;
  return fs.readFileSync(txtPath, 'utf-8').trim();
}

function scanVoiceTraining() {
  const summary = [];

  for (const category of categories) {
    const catDir = path.join(rootDir, category);
    const files = fs.existsSync(catDir) ? fs.readdirSync(catDir).filter(f => f.endsWith('.mp3')) : [];
    const emotionSummary = {
      total: files.length,
      highlights: [],
      scores: {
        assertive: 0,
        bonding: 0,
        neutral: 0,
        reflective: 0,
        technical: 0
      }
    };

    for (const file of files) {
      const mp3Path = path.join(catDir, file);
      const transcript = getTranscript(mp3Path);
      if (!transcript) {
        console.warn(`⚠️ Skipped: ${file} — no transcript found.`);
        continue;
      }

      const detected = detectEmotionWeights(transcript);
      if (detected && emotionSummary.scores[detected] !== undefined) {
        emotionSummary.scores[detected]++;
      }
      if (transcript.length > 100) {
        emotionSummary.highlights.push(`• ${file}: ${transcript.slice(0, 120)}...`);
      }
    }

    summary.push(`## ${category.toUpperCase()}`);
    summary.push(`- Samples: ${emotionSummary.total}`);
    summary.push(`- Breakdown: ${Object.entries(emotionSummary.scores).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
    if (emotionSummary.highlights.length) {
      summary.push(`- Highlights:`);
      summary.push(...emotionSummary.highlights);
    }
    summary.push('');
  }

  fs.writeFileSync(outputFile, summary.join('\n'), 'utf-8');
  console.log(`📊 Voice self-teach summary saved to: ${outputFile}`);
}

scanVoiceTraining();
