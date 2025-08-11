import os

# Base path to wav_training directory
BASE_DIR = 'voice/wav_training'

# List of emotional tones to add
tones_to_add = [
    'confident',
    'defensive',
    'sarcastic',
    'compassionate',
    'humorous',
    'charismatic',
    'frustrated',
    'apologetic'
]

# Create each subfolder if it doesn't exist
for tone in tones_to_add:
    path = os.path.join(BASE_DIR, tone)
    try:
        os.makedirs(path, exist_ok=True)
        print(f"✅ Created or confirmed: {path}")
    except Exception as e:
        print(f"❌ Failed to create {path}: {e}")