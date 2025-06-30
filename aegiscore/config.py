import os
from dotenv import load_dotenv

# Load variables from .env into the environment
load_dotenv()

# Expose as module‐level constants
ELEV_API_KEY   = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID       = os.getenv("ELEVENLABS_VOICE_ID")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # optional for future GPT calls
