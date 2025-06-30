import pytest

from aegiscore.handlers.help import handle_help
from aegiscore.handlers.emotion import handle_emotion
from aegiscore.handlers.pulse_led import handle_pulse_led
from aegiscore.handlers.play_voice import handle_play_voice
from aegiscore.handlers.status import handle_status
from aegiscore.commands import dispatch

@pytest.mark.parametrize("cmd,expected", [
    ("help", "🤝 Available commands"),
    ("emotion", "🙂 Curious"),
    ("led rainbow", "💡 LED effect: rainbow"),
    ("speak", "⚠️ No text provided"),
])
def test_simple_handlers(cmd, expected):
    result = dispatch(cmd, {})
    assert expected in result

def test_status_returns_fields():
    out = handle_status()
    for key in ("System:", "Release:", "CPU Cores:", "Memory (GB):", "Uptime (s):"):
        assert key in out

def test_dispatch_unknown():
    resp = dispatch("foobarbaz", {})
    assert "Unknown command" in resp
