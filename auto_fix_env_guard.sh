#!/bin/bash
# Auto-fix missing env_guard imports in .mjs and .sh files

echo "🔧 Auto-fixing env_guard references..."
echo

MJS_IMPORT="import { requireEnv } from '../../voice/utils/env_guard.mjs';"
SH_SOURCE=". ./scripts/lib/env_guard.sh"

# Fix .mjs files
find . -type f -name "*.mjs" ! -path "./node_modules/*" | while read -r file; do
    if ! grep -q "requireEnv" "$file"; then
        echo "➕ Adding env_guard import to $file"
        # Insert after "use strict" if present, else at top
        if grep -q '"use strict"' "$file"; then
            sed -i '' "/\"use strict\"/a\\
$MJS_IMPORT
" "$file"
        else
            sed -i '' "1i\\
$MJS_IMPORT
" "$file"
        fi
    fi
done

# Fix .sh files
find . -type f -name "*.sh" ! -path "./node_modules/*" | while read -r file; do
    if ! grep -q "env_guard.sh" "$file"; then
        echo "➕ Adding env_guard source to $file"
        if head -n 1 "$file" | grep -q "^#!"; then
            sed -i '' "2i\\
$SH_SOURCE
" "$file"
        else
            sed -i '' "1i\\
$SH_SOURCE
" "$file"
        fi
    fi
done

echo
echo "✅ Auto-fix complete!"