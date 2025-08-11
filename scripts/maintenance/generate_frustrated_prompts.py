import os

# === CONFIGURATION ===
emotion = "frustrated"
output_dir = f"voice/wav_training/{emotion}"
num_prompts = 50

prompts = [
    "I’m trying, but it’s like shouting into the void.",
    "Why does this have to be so complicated?",
    "I’m tired of repeating myself over and over.",
    "It shouldn’t be this hard to be understood.",
    "Nothing I do seems to be enough right now.",
    "I’ve hit my limit, and I don’t know what else to give.",
    "Every time I fix one thing, three more break.",
    "This isn’t what I signed up for.",
    "How many times do I have to explain the same thing?",
    "I just want one thing to go smoothly today.",
    "I’m running on fumes, and no one seems to notice.",
    "It’s exhausting to feel like I’m always the one holding it together.",
    "I can’t keep pretending everything’s fine.",
    "I’m over it. All of it.",
    "I’ve said everything I can think to say.",
    "This is beyond frustrating — it’s disheartening.",
    "I'm trying to stay calm, but it's not working.",
    "It feels like I’m yelling into a brick wall.",
    "I'm not asking for a miracle — just a break.",
    "Why does this keep happening?",
    "I feel stuck, and it's infuriating.",
    "I keep showing up, and it's still not enough.",
    "It’s like the harder I try, the worse it gets.",
    "I just want to scream sometimes.",
    "I wish someone would actually listen for once.",
    "I’ve had enough of this cycle.",
    "I’m so sick of starting over.",
    "This isn’t what I planned, and it’s driving me crazy.",
    "I’m stretched too thin, and no one seems to care.",
    "Why is everything a battle?",
    "It feels like nothing I say makes a difference.",
    "I’ve hit the wall, and I’m out of ideas.",
    "It’s always one thing after another.",
    "No matter what I do, it’s not right.",
    "I can’t keep fixing what I didn’t break.",
    "I feel like I’m drowning in expectations.",
    "This whole thing is just exhausting.",
    "I’m frustrated with myself for even caring.",
    "I need a pause that actually feels like rest.",
    "I wish it didn’t always feel like a struggle.",
    "My patience has officially run out.",
    "It’s like I’m stuck in the same loop.",
    "Why do I always have to be the one to hold it together?",
    "I’m trying not to snap, but I’m close.",
    "This isn’t fair, and it never has been.",
    "I need someone to step up for once.",
    "I’m so tired of pretending it’s fine.",
    "Everything feels like it’s working against me.",
    "It’s getting harder to care.",
    "I just need something — anything — to change."
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
