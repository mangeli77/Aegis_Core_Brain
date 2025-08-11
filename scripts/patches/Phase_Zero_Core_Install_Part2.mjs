import { requireEnv } from '../../core/voice/utils/env_guard.mjs';
// Phase Zero – Core Install Part 2 (Rev 5)
// Installs: voice_loop.py + memory_injector.mjs

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../');

const files = [
  {
    path: 'core/voice/audio/voice_loop.py',
    content: `
# Voice Loop – Rev 5
# Records mic input, runs Whisper, outputs transcript

import sounddevice as sd
import queue
import numpy as np
import whisper
import os

q = queue.Queue()
samplerate = 16000
channels = 1
blocksize = 1024
seconds = 5

model = whisper.load_model("base")

def callback(indata, frames, time, status):
    q.put(indata.copy())

with sd.InputStream(samplerate=samplerate, channels=channels, callback=callback, blocksize=blocksize):
    print("🎙️ Listening... Speak now.")
    audio = []
    for _ in range(0, int(samplerate / blocksize * seconds)):
        audio.append(q.get())

    audio_np = np.concatenate(audio, axis=0)
    file = "voice/input.wav"
    os.makedirs("voice", exist_ok=True)
    sd.write(file, audio_np, samplerate)

    result = model.transcribe(file)
    with open("voice/input.wav.txt", "w") as f:
        f.write(result["text"])

    print("✅ Transcription complete:", result["text"])
`
  },
  {
    path: 'core/memory/memory_injector.mjs',
    content: `
// Memory Injector – Rev 5
import { appendFile } from 'fs/promises';
import path from 'path';

export async function injectToMemory(text, source = "voice_loop") {
  const logPath = path.resolve("Aegis/logs/transcripts/injected_memory.log");
  const timestamp = new Date().toISOString();
  const entry = \`\\n[\${timestamp}] (\${source}):\\n\${text}\\n\`;
  await appendFile(logPath, entry);
  console.log("🧠 Memory injected.");
}
`
  }
];

for (const file of files) {
  const fullPath = path.join(root, 'Aegis', file.path);
  const dir = path.dirname(fullPath);
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, file.content.trimStart(), 'utf-8');
  console.log(`✅ Installed: ${file.path}`);
}

console.log(`\n🔗 Core Install Part 2 complete — Voice Loop + Memory Injector wired.`);