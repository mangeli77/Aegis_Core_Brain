#!/bin/bash
# move_cognition_voice.sh
# Safely move cognition/ and voice/ into core/ while keeping old imports alive

set -e

echo "=== Starting safe move for cognition/ and voice/ into core/ ==="

# 1. Ensure core/ exists
mkdir -p core

# 2. Move directories into core/
if [ -d "cognition" ]; then
    mv cognition core/cognition
    echo "Moved cognition/ -> core/cognition/"
fi

if [ -d "voice" ]; then
    mv voice core/voice
    echo "Moved voice/ -> core/voice/"
fi

# 3. Create symlinks for backward compatibility
if [ ! -L "cognition" ]; then
    ln -s core/cognition cognition
    echo "Created symlink cognition -> core/cognition"
fi

if [ ! -L "voice" ]; then
    ln -s core/voice voice
    echo "Created symlink voice -> core/voice"
fi

# 4. List results
echo "=== Current structure ==="
ls -l | grep -E 'cognition|voice'

echo "=== Done! ==="
echo "Your old imports will still work until you remove the symlinks."
echo "Once all imports are updated to core/cognition and core/voice, delete the symlinks."