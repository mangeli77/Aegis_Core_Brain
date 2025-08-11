import os

# === CONFIGURATION ===
emotion = "sarcastic"
output_dir = f"voice/wav_training/{emotion}"
num_prompts = 50

prompts = [
    "Oh great, another meeting. Just what I needed.",
    "Wow, what a genius idea. Truly groundbreaking.",
    "Because clearly, doing it the hard way is more fun.",
    "Oh no, please — take your time. I’ve got forever.",
    "Perfect. More paperwork. My dream come true.",
    "Sure, because that plan worked so well last time.",
    "Let me guess — we’re winging it again? Shocking.",
    "Oh joy, another email to ignore.",
    "You don’t say. What an absolute surprise.",
    "I love repeating myself. It’s my cardio.",
    "Oh yes, please tell me how I’m wrong again.",
    "Another brilliant idea from the master of chaos.",
    "Because what we really needed was more confusion.",
    "Well isn’t this just a picture of efficiency.",
    "Fantastic. Nothing like a last-minute change.",
    "Right, because nothing says productivity like panic.",
    "Wow, such helpful feedback. I’m moved.",
    "Another flawless execution — if we’re grading on chaos.",
    "Oh, great. Another file named 'Final_V2_REAL_FINAL'.",
    "Because clearly, I love wasting my time.",
    "Of course that’s how it went. Why wouldn’t it?",
    "Just when I thought it couldn’t get better, it didn’t.",
    "This is fine. Totally fine. Everything’s fine.",
    "Because reinventing the wheel is so productive.",
    "Great! Another meeting that could’ve been an email.",
    "Perfect timing — as always, two days late.",
    "Oh look, my favorite: vague instructions and high expectations.",
    "A flawless plan — if we lived in a cartoon.",
    "I’m thrilled. Can’t you tell from my monotone joy?",
    "Yes, please assign me more tasks I wasn’t consulted on.",
    "Wonderful. I was hoping for a surprise panic attack.",
    "Can’t wait to do this all over again next week.",
    "Because the last-minute approach never fails. Except always.",
    "Why plan when you can improvise poorly?",
    "What a stunning display of coordination. Truly.",
    "Sure, I’ll drop everything to fix your emergency.",
    "You want it when? Yesterday? Perfect.",
    "I’m not overwhelmed — I’m underfunded and overbooked.",
    "Oh cool, let’s pretend this wasn’t already a problem.",
    "Well, isn’t this a productive use of everyone’s time.",
    "Yes, I totally signed up for this — in a dream I can’t remember.",
    "The plan’s solid — if by solid we mean made of Jello.",
    "Another email thread with 47 replies. Delightful.",
    "Clearly, communication is our team’s strong suit.",
    "Because guessing is always better than knowing.",
    "If I had a dollar for every time this happened, I’d retire.",
    "We don’t need clarity — mystery is more exciting.",
    "Yup, that sounds like a sustainable strategy... not.",
    "Oh, fantastic. Another round of miscommunication bingo."
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