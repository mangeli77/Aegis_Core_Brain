cat << 'EOF' > README.md
# Aegis Core Brain

A lightweight soft-boot version of your custom AI assistant, handling text commands, memory, and dispatching to feature handlers.

## Setup

1. Clone repo.
2. Copy \`.env.example\` → \`.env\` and populate keys.
3. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

## Usage

\`\`\`bash
python -m aegiscore.app
\`\`\`

## Structure

- **aegiscore/app.py**: main loop & memory persistence  
- **aegiscore/config.py**: loads \`.env\` variables  
- **aegiscore/commands.py**: simple dispatcher  
- **aegiscore/handlers/**: individual feature modules  
EOF
