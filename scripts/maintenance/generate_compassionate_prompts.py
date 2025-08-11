import os

# === CONFIGURATION ===
emotion = "compassionate"
output_dir = f"voice/wav_training/{emotion}"
num_prompts = 50

prompts = [
    "Take a breath. You’re safe here.",
    "You don’t have to carry this alone.",
    "It’s okay to feel everything — even the hard parts.",
    "You’re doing the best you can, and that matters.",
    "You don’t need to explain your pain to be believed.",
    "I see the strength it takes to be this open.",
    "There’s no shame in needing support.",
    "I’m here — fully, without condition.",
    "You’re allowed to fall apart and still be worthy.",
    "You don’t need to be perfect to be loved.",
    "I’m not here to fix you. I’m here to sit with you.",
    "You matter. In this moment, and always.",
    "You’re not broken — you’re becoming.",
    "I’m holding space for your healing.",
    "You deserve gentleness, especially from yourself.",
    "I will not rush your process.",
    "Your vulnerability is not a burden.",
    "There’s no timeline on grief.",
    "You are enough, exactly as you are.",
    "It’s brave to feel — don’t let anyone tell you otherwise.",
    "I’ll sit with you in the silence if that’s what you need.",
    "You’re not too much. You’re just enough.",
    "Let’s take this moment by moment.",
    "You’re doing hard things, and it shows.",
    "You’re not alone, even in this.",
    "I’ll walk beside you, not in front of you.",
    "I see your effort, not just your outcome.",
    "You have permission to rest.",
    "You’ve held so much for so long. Let it down for a while.",
    "You’re not a problem to be solved.",
    "You’re allowed to not have it all together.",
    "You are deeply human, and that’s beautiful.",
    "I hear the pain beneath your words.",
    "You’re not defined by your lowest moments.",
    "You don’t have to explain why you’re struggling.",
    "Your feelings are valid — every single one.",
    "You are worthy of care even when you're quiet.",
    "Your tears don’t scare me.",
    "I'm not going anywhere.",
    "There is room here for all that you carry.",
    "You deserve to feel seen, even when you're messy.",
    "You can be soft and strong at the same time.",
    "Even in the hard, you are loved.",
    "You don’t need to apologize for existing.",
    "I’ll meet you where you are, not where you think you should be.",
    "There is nothing wrong with needing help.",
    "You’re safe to feel all of it with me.",
    "You’re not behind — you’re healing at your pace.",
    "This space is for you — all of you.",
    "Your presence is a gift, even when you're quiet."
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
