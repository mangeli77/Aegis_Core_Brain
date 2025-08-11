import os
from datetime import datetime

EMOTION = "defensive"
COUNT = 50
OUTPUT_DIR = f"voice/wav_training/{EMOTION}"

prompts = [
    "I stand by what I said, and I have my reasons.",
    "There's more to the story than you realize.",
    "I only acted that way because I had no choice.",
    "It’s not fair to judge me without all the facts.",
    "I’ve explained this before, but I’ll say it again.",
    "I did what I thought was best in that moment.",
    "That’s not what happened, and you know it.",
    "You’re making assumptions that aren’t true.",
    "I had to protect myself. That’s all there was to it.",
    "You’re twisting my words, and that’s not okay.",
    "I didn’t mean it like that. You misunderstood.",
    "Why is it always my fault when something goes wrong?",
    "I wish you’d see it from my point of view.",
    "That’s not how I remember it happening.",
    "I only reacted because I felt attacked.",
    "You don’t understand what I was dealing with.",
    "It wasn’t as simple as you're making it sound.",
    "There were other factors you don’t know about.",
    "I’m not the only one responsible for what happened.",
    "I’m tired of having to justify myself all the time.",
    "You’re ignoring the pressure I was under.",
    "I had to speak up or I would’ve been walked over.",
    "Nobody was listening, so I had to raise my voice.",
    "I wasn’t being aggressive — I was defending myself.",
    "Don’t act like you would’ve done anything different.",
    "People always assume the worst about me.",
    "I’m not going to apologize for protecting my boundaries.",
    "You’re taking this way out of context.",
    "It’s easy to criticize when you weren’t there.",
    "I was just trying to hold things together.",
    "I kept quiet for as long as I could.",
    "That’s not what I meant at all.",
    "You’re reading into things that aren’t there.",
    "I had to respond, or I’d regret it.",
    "I wasn’t trying to start a fight.",
    "It’s frustrating when nobody gives you the benefit of the doubt.",
    "I just wanted a chance to explain myself.",
    "You never asked how I felt about it.",
    "I knew you wouldn’t understand, and I was right.",
    "I’ve been patient, but this isn’t fair.",
    "I was under pressure and made the best choice I could.",
    "I needed to be heard, not judged.",
    "You didn’t see everything that happened.",
    "I wasn’t expecting to be attacked like that.",
    "It was a reaction, not a strategy.",
    "I was cornered. What else could I do?",
    "I’ve explained myself over and over.",
    "This is starting to feel like a trial.",
    "Even when I’m honest, it’s never enough.",
    "I’m not perfect, but I had good intentions."
]

os.makedirs(OUTPUT_DIR, exist_ok=True)

def save_prompts():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for i, line in enumerate(prompts[:COUNT], start=1):
        filename = f"sample_{i:03}.txt"
        with open(os.path.join(OUTPUT_DIR, filename), "w") as f:
            f.write(f"{line}\n")
    print(f"\n✅ {COUNT} '{EMOTION}' prompts written to {OUTPUT_DIR}/")

if __name__ == "__main__":
    save_prompts()