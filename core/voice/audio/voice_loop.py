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
