// scripts/maintenance/attic_restore.mjs
import fs from 'fs';
import path from 'path';

const atticDir = path.resolve('./attic');
const logPath  = path.join(atticDir, '.move_log.json');

if (!fs.existsSync(atticDir) || !fs.existsSync(logPath)) {
  console.error('No attic/.move_log.json found. Nothing to restore.');
  process.exit(1);
}

const moves = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
for (const { from, to } of moves.reverse()) {
  const absFrom = path.resolve(from);
  const absTo   = path.resolve(to);
  const parent  = path.dirname(absTo);
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
  if (fs.existsSync(absFrom)) {
    fs.renameSync(absFrom, absTo);
    console.log(`↩︎ Restored: ${from} → ${to}`);
  } else {
    console.warn(`⚠️ Missing in attic: ${from}`);
  }
}

// Clear the log after successful restore
fs.writeFileSync(logPath, JSON.stringify([], null, 2));
console.log('✅ Restore complete.');