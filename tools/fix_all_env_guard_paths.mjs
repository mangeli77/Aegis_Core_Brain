import fs from "node:fs";
import path from "node:path";

const TARGET = path.resolve("core/voice/utils/env_guard.mjs");
const EXCLUDE_DIRS = new Set(["node_modules", "logs", ".git", "core/cognition/learning/voice/raw_scripts"]);

function shouldSkipDir(dir) {
  return EXCLUDE_DIRS.has(path.basename(dir));
}

function walk(dir, out) {
  if (shouldSkipDir(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p, out);
    } else if (/\.(m?js|cjs|ts|tsx)$/.test(entry.name)) {
      out.push(p);
    }
  }
}

function ensureDotPrefix(rel) {
  const unix = rel.replace(/\\/g, "/");
  return unix.startsWith(".") ? unix : `./${unix}`;
}

console.log("🔍 scanning…");
const files = [];
walk(process.cwd(), files);

let changed = 0;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes("env_guard.mjs")) continue;

  // compute correct relative path from this file to TARGET
  const rel = ensureDotPrefix(path.relative(path.dirname(file), TARGET));
  const fixed = text.replace(/from\s+['"][^'"]*env_guard\.mjs['"]/g, `from '${rel}'`);

  if (fixed !== text) {
    fs.writeFileSync(file, fixed, "utf8");
    console.log(`✅ fixed: ${path.relative(process.cwd(), file)}`);
    changed++;
  }
}

console.log(`\n✨ done. updated ${changed} file(s).`);
