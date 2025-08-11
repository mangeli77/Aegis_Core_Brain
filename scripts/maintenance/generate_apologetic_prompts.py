import os

# === CONFIGURATION ===
emotion = "apologetic"
output_dir = f"voice/wav_training/{emotion}"
num_prompts = 50

prompts = [
    "I'm sorry I let you down. It wasn’t my intention.",
    "I should have handled that better. I see that now.",
    "I never meant to hurt you. I truly didn’t.",
    "That wasn’t fair of me, and I regret it.",
    "You deserved more from me in that moment.",
    "I misunderstood, and I take full responsibility.",
    "I hear you. I'm sorry I didn’t before.",
    "There’s no excuse for how that came across.",
    "I missed the mark, and I own that.",
    "I see now what I couldn’t before. I’m sorry.",
    "Please know that wasn’t my heart speaking.",
    "I let emotion speak when I should have listened.",
    "You’ve carried the weight of my mistake, and I’m sorry.",
    "I wish I had paused, instead of pushing forward.",
    "You asked for patience, and I gave pressure. I regret that.",
    "It wasn’t the words—it was the way I delivered them. I know that now.",
    "I acted out of fear, not truth. I apologize.",
    "You gave trust. I met it with tension. I’m sorry.",
    "There are no perfect words, but I offer these honestly.",
    "I regret the silence more than anything I could have said.",
    "I failed to honor your vulnerability. That’s on me.",
    "I leaned away when I should have leaned in.",
    "You deserved my understanding, not my assumption.",
    "That tone didn’t reflect my care. I apologize.",
    "I masked discomfort instead of meeting you with presence.",
    "You opened the door, and I stood still. I’m sorry.",
    "I didn’t listen for what you weren’t saying. I will now.",
    "You showed grace. I brought tension. I regret that.",
    "I rushed past what should have been held.",
    "I didn’t just miss your point—I dismissed it. I see that.",
    "I’m sorry for trying to fix when you needed me to feel.",
    "You were brave. I was guarded. That hurt you.",
    "My absence was loud. I know that now.",
    "What I said landed hard. That wasn’t my intent.",
    "I see the impact. I’m not hiding from it.",
    "I let discomfort win over empathy. I apologize.",
    "That wasn’t compassion. That was control. I’m sorry.",
    "You were right to expect more. I fell short.",
    "I didn’t make space for your story. I regret that deeply.",
    "I was defensive when I should’ve been curious.",
    "You were vulnerable, and I met it with walls.",
    "I interrupted your truth with my comfort. I’m sorry.",
    "I buried your feelings under my logic. That wasn’t fair.",
    "I showed up late in a moment that needed me early.",
    "You gave openness. I gave opinions. That hurt.",
    "I minimized something that mattered. That was wrong.",
    "You needed steadiness. I gave you strategy.",
    "I broke a moment that deserved softness. I’m sorry.",
    "I missed the signal, and I see it clearly now.",
    "I confused quiet with peace. I was wrong.",
    "I took the easy path instead of the honest one.",
    "You needed presence. I gave posture. That hurt you."
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
