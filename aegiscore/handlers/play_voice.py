import requests
from playsound import playsound
from aegiscore.config import ELEV_API_KEY, VOICE_ID

def handle_play_voice(text):
    if not text:
        return "⚠️ No text provided. Usage: speak <text>"

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    headers = {"xi-api-key": ELEV_API_KEY, "Content-Type": "application/json"}
    payload = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {"stability": 0.4, "similarity_boost": 0.8}
    }

    resp = requests.post(url, headers=headers, json=payload)
    if resp.status_code == 200:
        with open("output.mp3", "wb") as f:
            f.write(resp.content)
        playsound("output.mp3")
        return "🔊 Played speech output."
    return f"❌ TTS error: {resp.text}"
