import os

# === CONFIGURATION ===
emotion = "neutral"
output_dir = f"voice/wav_training/{emotion}"
num_prompts = 50

prompts = [
    "The meeting was scheduled for 3:00 p.m.",
    "I walked to the store and returned home.",
    "The report was submitted before the deadline.",
    "The weather today is partly cloudy.",
    "The package arrived on time.",
    "There was a slight delay in processing.",
    "I finished the assignment and emailed it.",
    "Please review the attached document.",
    "We will revisit the topic next week.",
    "The update was applied without issue.",
    "The file was uploaded successfully.",
    "Our next meeting is set for Monday.",
    "The form must be completed before submission.",
    "I’ve noted your request for changes.",
    "Please confirm your attendance.",
    "The link is available on the website.",
    "All items were accounted for.",
    "The data was entered into the system.",
    "Let me know if you have any questions.",
    "The session started on time and ended early.",
    "Lunch will be served in the break room.",
    "She submitted the form this morning.",
    "The notice was sent via email.",
    "There were no objections from the team.",
    "The calendar has been updated.",
    "Your feedback has been recorded.",
    "The file size is within the limit.",
    "Please review the notes before the meeting.",
    "The invoice was paid yesterday.",
    "We will proceed as planned.",
    "He replied with a short message.",
    "The materials were shipped earlier today.",
    "The button triggers the next screen.",
    "The system rebooted automatically.",
    "There was no significant difference.",
    "The print job is complete.",
    "Her tone was steady and clear.",
    "This folder contains all necessary files.",
    "I’ve scheduled a reminder.",
    "The status will be updated daily.",
    "There were no major changes to report.",
    "The session is currently in progress.",
    "We will begin shortly.",
    "The item was returned without damage.",
    "Your message has been received.",
    "The current version is up to date.",
    "He followed instructions exactly.",
    "The task has been assigned.",
    "The temperature remained consistent.",
    "We’ve completed the checklist."
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
