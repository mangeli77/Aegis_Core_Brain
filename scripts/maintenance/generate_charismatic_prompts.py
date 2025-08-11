import os

# === CONFIGURATION ===
emotion = "charismatic"
output_dir = f"voice/wav_training/{emotion}"
num_prompts = 50

prompts = [
    "When I speak, people don't just hear — they feel.",
    "Charisma isn’t volume — it’s vibration.",
    "I walk in like I belong, because I do.",
    "People lean in when I lean back.",
    "My silence often says more than my words.",
    "I don’t fill the room. I bend it.",
    "Confidence is the currency I deal in.",
    "I carry gravity in the way I pause.",
    "They remember how I made them feel, not just what I said.",
    "There’s a reason heads turn when I enter.",
    "I don’t audition. I arrive.",
    "My presence is the preface.",
    "Charm without truth is just noise.",
    "Every eye doesn't need to follow — just the right ones.",
    "I don’t chase attention. I attract alignment.",
    "I leave fingerprints on the moment.",
    "I make eye contact like I’m writing something down.",
    "I bring tempo to stillness.",
    "Even my stillness has rhythm.",
    "There’s magnetism in my restraint.",
    "My smile disrupts and disarms.",
    "I play silence like a stringed instrument.",
    "People remember my energy before my name.",
    "I don’t demand attention — I invite it.",
    "I make people feel like they’ve known me forever.",
    "Even when I whisper, I lead.",
    "I speak to the room, but I connect to the soul.",
    "There’s weight in my wit.",
    "I make people curious — not confused.",
    "I make pauses feel like poetry.",
    "I bring heat without burn.",
    "I don’t sell ideas — I embody them.",
    "I hold court without holding back.",
    "They remember the mood I left behind.",
    "I move through doubt like it’s dust.",
    "I wrap clarity in charm.",
    "My gestures tell the story before my voice does.",
    "My presence stays after I leave.",
    "My charisma doesn’t shout — it settles.",
    "I speak with conviction, not noise.",
    "I inspire without needing applause.",
    "My energy has its own echo.",
    "When I engage, the world leans closer.",
    "I make confidence feel contagious.",
    "They don’t remember what I said. They remember how it felt.",
    "I listen like I’m learning secrets.",
    "I smile like I know the ending.",
    "I turn conversations into gravity wells.",
    "I lead with charm, and follow with depth.",
    "My presence lingers like melody."  
]

# === Create Output Folder ===
os.makedirs(output_dir, exist_ok=True)

# === Write Files ===
for i, line in enumerate(prompts[:num_prompts]):
    filename = f"sample_{i+1:03d}.txt"
    path = os.path.join(output_dir, filename)
    with open(path, "w") as f:
        f.write(line.strip())

print(f"✅ {num_prompts} '{emotion}' prompts written to {output_dir}/")