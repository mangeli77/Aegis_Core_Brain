import os
import json
from aegiscore.commands import dispatch

# Point to memory.json at repo root
MEMORY_PATH = os.path.join(os.path.dirname(__file__), '..', 'memory.json')

def load_memory():
    try:
        with open(MEMORY_PATH) as f:
            return json.load(f)
    except FileNotFoundError:
        return {"log": [], "tasks": [], "categories": {}}

def save_memory(mem):
    with open(MEMORY_PATH, 'w') as f:
        json.dump(mem, f, indent=2)

def main():
    print("🛡️ Aegis Core Brain initialized.")
    memory = load_memory()

    while True:
        cmd = input(">> ").strip()
        if cmd.lower() in ('exit', 'quit'):
            break

        result = dispatch(cmd, memory)
        print(result)

        # log and persist
        memory["log"].append({"input": cmd})
        save_memory(memory)

if __name__ == '__main__':
    main()
