import os

# === CONFIGURATION ===
emotion = "reflective"
output_dir = f"voice/wav_training/{emotion}"
num_prompts = 50

prompts = [
    "Some lessons don’t arrive until we’re ready to receive them.",
    "I wonder how often we mistake silence for peace.",
    "What we bury doesn't stay buried — it becomes us.",
    "Growth often begins where comfort ends.",
    "I’ve learned more from stillness than from noise.",
    "We rarely recognize the moment that changes everything.",
    "Healing doesn’t always look heroic.",
    "Sometimes the most honest thing you can say is ‘I don’t know.’",
    "It’s strange how memory softens the sharpest moments.",
    "We outgrow people the same way we outgrow versions of ourselves.",
    "Not everything broken needs to be fixed — some things need to be felt.",
    "I wonder how often I confuse motion with meaning.",
    "Maybe peace isn’t a destination — it’s a decision.",
    "We carry more than we show. Everyone does.",
    "Who were you before the world told you who to be?",
    "Sometimes closure looks like choosing not to return.",
    "I’ve learned to listen to what isn’t being said.",
    "Regret is a heavy teacher — but it teaches.",
    "Even endings leave echoes.",
    "I’ve found that time doesn’t heal — presence does.",
    "Maybe forgiveness is less about them and more about peace.",
    "We mourn what we imagined as much as what we lost.",
    "Some goodbyes never say themselves aloud.",
    "It’s possible to miss what hurt you.",
    "I’ve mistaken survival for healing before.",
    "Stillness can be a form of strength.",
    "We carry childhood like a shadow.",
    "There’s no timeline for becoming who you are.",
    "I’ve confused being busy with being needed.",
    "Sometimes we revisit the pain just to feel something familiar.",
    "I’ve learned to question the stories I tell myself.",
    "Maybe grace is found in the pause, not the push.",
    "We grieve the version of ourselves that fit back then.",
    "It takes courage to be seen in your full complexity.",
    "The hardest mirror to face is the one that’s still.",
    "I've learned not every truth needs to be spoken to be understood.",
    "Sometimes the bravest thing you can do is rest.",
    "Reflection turns wounds into windows.",
    "I used to chase clarity. Now I sit and let it find me.",
    "We revisit the past hoping to rewrite what already shaped us.",
    "I've learned not to rush what asks for patience.",
    "Not every loss is loud.",
    "Healing doesn’t come with a trophy — but it should.",
    "You can’t rebuild on denial.",
    "I once confused achievement with worth.",
    "Sometimes we ask questions we’re not ready to answer.",
    "Stillness isn’t stagnation — it’s preparation.",
    "I’ve learned to thank what once broke me.",
    "Wholeness isn’t perfection — it’s permission to be in process."
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
