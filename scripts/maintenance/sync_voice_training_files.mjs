import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { speak } from '../../core/voice/utils/tts_router.mjs';
import { transcribeWav } from '../../core/voice/utils/whisper_transcriber.mjs';

const baseDir = path.resolve('./voice/wav_training');
const emotions = fs.readdirSync(baseDir).filter(name => !name.startsWith('.') && fs.statSync(path.join(baseDir, name)).isDirectory());

async function syncFolder(emotion) {
  const folderPath = path.join(baseDir, emotion);
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.txt') && f.startsWith('sample_'));

  for (const file of files) {
    const baseName = file.replace('.txt', '');
    const txtPath = path.join(folderPath, `${baseName}.txt`);
    const mp3Path = path.join(folderPath, `${baseName}.mp3`);
    const transcriptPath = path.join(folderPath, `${baseName}.wav.txt`);

    // Generate mp3 if missing
    if (!fs.existsSync(mp3Path)) {
      const prompt = fs.readFileSync(txtPath, 'utf-8').trim();
      console.log(`🎤 Synthesizing: ${emotion}/${baseName}.mp3`);
      await speak(prompt, mp3Path);
    }

    // Generate transcript if missing
    if (!fs.existsSync(transcriptPath)) {
      console.log(`🧠 Transcribing: ${emotion}/${baseName}.mp3 → .wav.txt`);
      const transcript = await transcribeWav(mp3Path);
      fs.writeFileSync(transcriptPath, transcript, 'utf-8');
    }
  }
}

(async () => {
  console.log('🔄 Syncing voice training files across all emotion folders...');
  for (const emotion of emotions) {
    await syncFolder(emotion);
  }
  console.log('✅ Sync complete. All .txt, .mp3, and .wav.txt files are aligned.');
})();