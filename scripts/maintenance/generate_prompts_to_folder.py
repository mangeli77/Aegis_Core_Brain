import os

# === CONFIGURATION ===
emotion = "assertive"
output_dir = f"voice/wav_training/{emotion}"
num_prompts = 50

prompts = [
    "Confirm the objective and proceed without delay.",
    "The task is non-negotiable. Execute immediately.",
    "This is the plan. Stick to it.",
    "Make the call. We’re not waiting.",
    "Disrupt the pattern. Now.",
    "Deliver results, not excuses.",
    "This decision is final.",
    "Take the initiative. Don’t ask.",
    "You've been briefed. Go.",
    "This is the window. Hit it hard.",
    "We don't hesitate. We lead.",
    "Cut the noise. Focus.",
    "You have clearance. Move.",
    "Drive the point home. Relentlessly.",
    "Dominance is established by action.",
    "Command the moment, not the room.",
    "Execute like your name is on the line.",
    "Control the tempo. Control the outcome.",
    "We don’t flinch. We finish.",
    "Tighten formation and apply pressure.",
    "Your energy speaks before you do.",
    "Clarity wins. Say it straight.",
    "Confidence isn’t loud. It’s precise.",
    "Make your move. They’ll adjust.",
    "The bar isn't high. It's yours.",
    "Respect follows action, not volume.",
    "Push forward even if no one claps.",
    "Get comfortable being underestimated.",
    "The room shifts when you commit.",
    "Precision beats noise. Every time.",
    "Stay sharp. Stay deliberate.",
    "If they blink, you move.",
    "Control your breath. Own the room.",
    "Conviction is louder than charisma.",
    "You're not reacting. You're deciding.",
    "Less talk. More presence.",
    "You are the quiet storm.",
    "Your posture writes your introduction.",
    "Let silence do the heavy lifting.",
    "When you speak, make it count.",
    "Be the echo of your intent.",
    "Tension builds power. Hold it.",
    "You're not here to perform. You're here to anchor.",
    "Make your tone the signature.",
    "They’ll feel you before they hear you.",
    "One glance. Full command.",
    "You don’t seek the spotlight. You are the signal.",
    "Disrupt with stillness.",
    "They listen because you don’t need them to.",
    "You carry consequence.",
    "Walk in like the outcome follows you."
]

# === Create Output Folder ===
os.makedirs(output_dir, exist_ok=True)

# === Write Files ===
for i, line in enumerate(prompts[:num_prompts]):
    filename = f"sample_{i+1:03d}.txt"
    path = os.path.join(output_dir, filename)
    with open(path, "w") as f:
        f.write(line.strip())

print(f"✅ {num_prompts} assertive prompts written to {output_dir}/")