import os

# === CONFIGURATION ===
emotion = "confident"
output_dir = f"voice/wav_training/{emotion}"
num_prompts = 50

prompts = [
    "I’ve got this. Every step is mine to own.",
    "I know what I bring to the table — and I built the table.",
    "I move with certainty, not arrogance.",
    "There’s no room for doubt — not in this moment.",
    "I don’t second-guess what I’ve already earned.",
    "I’ve walked through worse and came out louder.",
    "Confidence is quiet, but it fills the room.",
    "I don’t flinch when challenged. I focus.",
    "I trust my preparation, not luck.",
    "I’m not here to be liked. I’m here to be undeniable.",
    "I don’t need a spotlight — I create gravity.",
    "I don’t chase — I attract with clarity.",
    "I hold my own, even when the room shakes.",
    "There’s no need to prove what’s already true.",
    "I bring presence without performing.",
    "My confidence isn’t loud — it’s stable.",
    "I answer questions with results.",
    "I lead because I’ve done the work.",
    "There’s no imposter here. Just mastery.",
    "My posture speaks before I do.",
    "I walk into challenges like I already belong.",
    "This isn’t arrogance. It’s ownership.",
    "I don’t apologize for my momentum.",
    "I’m not perfect — I’m powerful in my progress.",
    "I exhale fear and inhale truth.",
    "I don’t over-explain. I over-deliver.",
    "I believe in what I’ve built.",
    "I’ve earned my place. I stand in it.",
    "Confidence doesn’t wait for consensus.",
    "I move forward because I trust the ground beneath me.",
    "I’ve trained for this moment. Now I own it.",
    "I walk with purpose, not permission.",
    "I act like it’s mine, because it is.",
    "No one hands me power. I claim it.",
    "I’m the calm in the chaos.",
    "There’s nothing louder than my quiet certainty.",
    "I own the mirror. I own the moment.",
    "Confidence walks ahead of credentials.",
    "I am grounded in my growth.",
    "I know exactly who I am becoming.",
    "I’m not intimidated. I’m intentional.",
    "My decisions aren’t shaky. They’re sharp.",
    "I’ve already earned the next level.",
    "This isn’t new. It’s what I’ve always been.",
    "I don’t shrink for comfort. I rise for truth.",
    "I plant my feet in confidence.",
    "I don’t hope I belong. I know it.",
    "I carry certainty like a compass.",
    "My energy speaks before I do.",
    "This is my voice, and I stand in it."
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
