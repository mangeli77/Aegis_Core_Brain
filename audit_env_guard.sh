#!/bin/bash
# Run from project root
echo "🔍 Auditing env_guard references..."
echo

# Search for .mjs files missing env_guard import
echo "=== Checking .mjs files ==="
find . -type f -name "*.mjs" ! -path "./node_modules/*" | while read -r file; do
    if grep -q "requireEnv" "$file"; then
        if ! grep -q "voice/utils/env_guard.mjs" "$file"; then
            echo "⚠️  Wrong or missing path in: $file"
        else
            echo "✅ $file"
        fi
    else
        echo "❌ No env_guard import in: $file"
    fi
done

echo
# Search for .sh files missing env_guard source
echo "=== Checking .sh files ==="
find . -type f -name "*.sh" ! -path "./node_modules/*" | while read -r file; do
    if grep -q "env_guard.sh" "$file"; then
        if ! grep -q "lib/env_guard.sh" "$file"; then
            echo "⚠️  Wrong or missing path in: $file"
        else
            echo "✅ $file"
        fi
    else
        echo "❌ No env_guard source in: $file"
    fi
done