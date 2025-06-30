from aegiscore.handlers.help import handle_help
from aegiscore.handlers.status import handle_status
from aegiscore.handlers.emotion import handle_emotion
from aegiscore.handlers.play_voice import handle_play_voice
from aegiscore.handlers.pulse_led import handle_pulse_led

def dispatch(command, memory):
    parts = command.strip().split(None, 1)
    cmd = parts[0].lower() if parts else ''
    args = parts[1] if len(parts) > 1 else ''

    if cmd == 'help':
        return handle_help()
    if cmd == 'status':
        return handle_status()
    if cmd == 'emotion':
        return handle_emotion()
    if cmd == 'speak':
        return handle_play_voice(args)
    if cmd == 'led':
        return handle_pulse_led(args)

    return "❓ Unknown command. Type 'help' to see available commands."
