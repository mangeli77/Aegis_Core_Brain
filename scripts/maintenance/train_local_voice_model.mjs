import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// scripts/maintenance/train_local_voice_model.mjs

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = path.resolve();
const WAV_DIR = path.join(ROOT, 'voice/wav_training');
const DATASET_DIR = path.join(ROOT, 'voice/training_dataset');
const OUTPUT_DIR = path.join(ROOT, 'voice/trained_model');
const METADATA_FILE = path.join(DATASET_DIR, 'metadata.csv');

const categories = ['assertive', 'bonding', 'neutral', 'reflective', 'technical'];

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function convertToWav(mp3Path, wavPath) {
  try {
    execSync(`ffmpeg -y -i "${mp3Path}" -ar 22050 -ac 1 -f wav "${wavPath}"`, {
      stdio: 'ignore',
    });
  } catch (err) {
    console.error(`FFmpeg error on ${mp3Path}`);
  }
}

function buildDataset() {
  ensureDir(DATASET_DIR);
  const entries = [];

  for (const category of categories) {
    const folder = path.join(WAV_DIR, category);
    if (!fs.existsSync(folder)) continue;

    const files = fs.readdirSync(folder).filter(f => f.endsWith('.mp3'));
    for (const file of files) {
      const base = file.replace(/\.mp3$/, '');
      const mp3Path = path.join(folder, `${base}.mp3`);
      const txtPath = path.join(folder, `${base}.txt`);
      const wavPath = path.join(DATASET_DIR, `${category}_${base}.wav`);

      if (!fs.existsSync(txtPath)) {
        console.warn(`⚠️  Missing transcript for ${file}`);
        continue;
      }

      convertToWav(mp3Path, wavPath);

      const text = fs.readFileSync(txtPath, 'utf-8').replace(/\n/g, ' ').trim();
      entries.push(`${category}_${base}|${text}`);
    }
  }

  fs.writeFileSync(METADATA_FILE, entries.join('\n'), 'utf-8');
  console.log(`✅ Coqui training metadata saved to: ${METADATA_FILE}`);
  console.log(`🗂️  ${entries.length} samples ready for training.`);
  console.log(`📁 Run training using: TTS --config_path your_config.json --restore_path ...`);
}

buildDataset();