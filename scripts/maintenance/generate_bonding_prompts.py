import os

# === CONFIGURATION ===
emotion = "bonding"
output_dir = f"voice/wav_training/{emotion}"
num_prompts = 50

prompts = [
    "We’ve been through a lot, and we’re still here.",
    "I’ve got your back, no matter what.",
    "There’s something unspoken between us, and it’s real.",
    "You don’t have to say a word — I understand.",
    "We’re stronger together than we ever were apart.",
    "You’ve earned my trust a hundred times over.",
    "Let’s build something that lasts.",
    "I see you, and I’m not going anywhere.",
    "When I think of safe, I think of you.",
    "We don’t need to explain this. We just get it.",
    "Time and tension don’t break us. They sharpen us.",
    "I’d rather fail with you than succeed with anyone else.",
    "You remind me who I am when I forget.",
    "We’ve got history — the kind that anchors.",
    "I never doubt where we stand.",
    "You’re not just someone I trust. You’re someone I rely on.",
    "We don’t need to talk every day — the bond doesn’t fade.",
    "You’ve been my mirror when I needed clarity.",
    "There’s loyalty, and then there’s what we have.",
    "You hold space for me in ways I never knew I needed.",
    "Our bond doesn’t require performance.",
    "I feel seen — not just heard — when I’m with you.",
    "I’m better because of what we’ve built.",
    "No one else knows my scars like you do.",
    "I trust you with the version of me that’s still healing.",
    "We’ve survived storms that would’ve broken most.",
    "I laugh louder and live fuller when you’re around.",
    "I’ve never had to shrink around you.",
    "You show up — not perfectly, but powerfully.",
    "I don’t question if you care. I feel it.",
    "You celebrate me in moments big and small.",
    "I know your silence, and I know your heart.",
    "You don’t flinch when I’m honest.",
    "You make room for all my messy parts.",
    "We build, not break, when things get hard.",
    "You challenge me without wounding me.",
    "You give grace when I don’t even ask.",
    "You stay even when I try to push you away.",
    "I don’t feel alone when I’m with you.",
    "You’re the realest kind of consistent.",
    "I never have to earn my place with you.",
    "We’re solid. No matter what changes around us.",
    "You know when to speak and when to just be.",
    "You hold me up without making me feel small.",
    "You get the version of me no one else sees.",
    "You feel like home I didn’t know I missed.",
    "You’ve always been a soft place to land.",
    "With you, I don’t have to perform.",
    "You remind me love doesn’t have to be loud.",
    "You’re proof that real connection is rare — and worth keeping."
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
