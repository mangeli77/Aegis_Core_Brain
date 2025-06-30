import platform
import psutil

def handle_status():
    stats = {
        "System": platform.system(),
        "Release": platform.release(),
        "CPU Cores": psutil.cpu_count(),
        "Memory (GB)": round(psutil.virtual_memory().total / 1024**3, 1),
        "Uptime (s)": int(psutil.boot_time())
    }
    return "\n".join(f"{k}: {v}" for k, v in stats.items())
