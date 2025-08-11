import os

# === CONFIGURATION ===
emotion = "technical"
output_dir = f"voice/wav_training/{emotion}"
num_prompts = 50

prompts = [
    "The system will automatically reboot after applying updates.",
    "Latency must remain below 50 milliseconds for optimal performance.",
    "The circuit requires a 220-ohm resistor to prevent overcurrent.",
    "Ensure the network configuration file is saved in the root directory.",
    "Bandwidth allocation can be adjusted via the control panel.",
    "Voltage fluctuations exceeding 5% should trigger a failsafe.",
    "The firmware version must match the hardware revision number.",
    "Thermal throttling will initiate once the CPU exceeds 90 degrees Celsius.",
    "Use a grounded outlet to minimize electrical noise.",
    "The hash function produces a 256-bit output.",
    "Be sure to terminate each line in the config with a semicolon.",
    "The REST API requires authentication via a bearer token.",
    "This application supports both JSON and XML payloads.",
    "All logs are stored in the /var/logs directory by default.",
    "Check that the cooling fan operates at the rated RPM.",
    "The error code 0x80070005 indicates a permissions issue.",
    "TLS 1.2 must be enabled for secure connections.",
    "The optical sensor reads up to 1200 DPI.",
    "Ensure all endpoints are properly sanitized.",
    "Double-check the polarity before powering the circuit.",
    "Response time should not exceed 200ms under load.",
    "The microcontroller operates at 3.3 volts.",
    "Static IP addresses must fall within the reserved subnet.",
    "Install the required dependencies using the package manager.",
    "The control algorithm uses PID for regulation.",
    "Check that the baud rate matches both devices.",
    "Encryption keys must be rotated every 90 days.",
    "Use shielded cable to avoid signal degradation.",
    "The database query returned no matching records.",
    "This sensor uses I2C for communication.",
    "The system must maintain 99.9% uptime.",
    "Data packets should include a CRC checksum.",
    "Compile the code with the debug flag enabled.",
    "Refer to the documentation for available endpoints.",
    "Multithreading improves responsiveness in this context.",
    "Ensure that input validation is enforced.",
    "Firmware updates must not interrupt system processes.",
    "Ensure isolation between high-voltage and logic-level components.",
    "The backup interval is configurable via cron.",
    "The current draw exceeds the maximum rating.",
    "Heap memory usage should remain under 75%.",
    "Configure rate limiting to prevent abuse.",
    "Reference the device's datasheet for pin configuration.",
    "SSH access is limited to key-based authentication.",
    "The oscillator must be tuned to 16 MHz.",
    "This subsystem supports hot-swapping modules.",
    "Ensure redundancy is active before deploying.",
    "Always debounce mechanical switches in code.",
    "Logging level should be adjusted in production.",
    "Use mutexes to prevent race conditions."  
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
