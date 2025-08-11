import os

# === CONFIGURATION ===
emotion = "humorous"
output_dir = f"voice/wav_training/{emotion}"
num_prompts = 50

prompts = [
    "I told my plants I love them. Now they’re plotting something.",
    "I tried adulting. Turns out, I need a refund.",
    "I’m not saying I’m bad at cooking, but the fire alarm knows my name.",
    "If I had a dollar for every time I got distracted... I want tacos.",
    "I work out… my patience, every day.",
    "I put the ‘pro’ in procrastinate.",
    "My sense of direction is so bad, I once got lost in a circle.",
    "I don’t need anger management — I need people to stop being stupid.",
    "I'm not lazy, I'm just in energy-saving mode.",
    "I followed my dreams. They led me to the fridge.",
    "If sarcasm burned calories, I’d be invisible.",
    "I sleep like a baby — up every two hours and crying.",
    "My brain has too many tabs open.",
    "I tried yoga once. I fell asleep in child’s pose.",
    "I’m on a seafood diet. I see food and I eat it.",
    "Common sense is like deodorant — those who need it most never use it.",
    "I don't have a bucket list — just a list of snacks to try.",
    "I’d agree with you, but then we’d both be wrong.",
    "My mood depends on how well my eyebrows cooperate.",
    "I’m not weird. I’m a limited edition.",
    "Exercise? I thought you said extra fries.",
    "I'm not short — I'm concentrated awesome.",
    "I thought I wanted a career. Turns out, I just wanted a paycheck.",
    "I put the ‘fun’ in dysfunctional.",
    "My Wi-Fi signal is stronger than my will to work.",
    "Why fall in love when you can fall asleep?",
    "I tried to be normal once. Worst two minutes ever.",
    "I wish I were a burrito — wrapped up, warm, and wanted.",
    "I downloaded a productivity app. Then I ignored it.",
    "I drink coffee for your protection.",
    "My dog gets more likes than I do.",
    "I’m multitasking: I can listen, ignore, and forget all at once.",
    "Running late is my cardio.",
    "I tried to do a cleanse, but cookies kept finding me.",
    "My phone battery lasts longer than my motivation.",
    "I told my goals to leave a voicemail.",
    "I'm so bright, my mom calls me her electric bill.",
    "I wear black because it’s one less decision in the morning.",
    "My life feels like a group project — and I’m the only one working.",
    "I Googled my symptoms. Turns out, I’m dramatic.",
    "I do my best proofreading after I hit send.",
    "The early bird can have the worm. I’ll take pancakes at noon.",
    "Don’t grow up. It’s a trap.",
    "I text faster when I'm mad. It's a skill.",
    "My hobbies include avoiding eye contact and overthinking.",
    "I clean when I’m stressed. My house is a mess.",
    "I want a job where I get paid to nap.",
    "I’ll be productive tomorrow. Probably.",
    "I whisper to my microwave so it doesn’t beep loudly.",
    "I’m not antisocial — I’m pro silence."
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
