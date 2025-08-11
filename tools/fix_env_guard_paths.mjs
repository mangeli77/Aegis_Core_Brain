// tools/fix_env_guard_paths.mjs
import fs from "node:fs";
import path from "node:path";

/** Absolute target we want every import to reference */
const TARGET_ABS = path.resolve("core/voice/utils/env_guard.mjs");

/** Directories to skip completely */
const SKIP = new Set(["node_modules", ".git", "logs", "core/cognition/learning/voice/raw_scripts"]);

/** Which file extensions to process */
const FILE_RE = /\.(?:m?js|cjs|ts|tsx)$/i;

/** Regexes that find any env_guard.mjs import (static or dynamic) */
const RX_FROM = /(from\s*['"])([^'"]*?env_guard\.mjs(?:[?#][^'"]*)?)(['"])/g;
const RX_DYN  = /(import\(\s*['"])([^'"]*?env_guard\.mjs(?:[?#][^'"]*)?)(['"]\s*\))/g;

function shouldSkipDir(dir) {
  return SKIP.has(path.basename(dir));
}

function walk(dir, out) {
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!shouldSkipDir(p)) walk(p, out);
    } else if (FILE_RE.test(e.name)) {
      out.push(p);
    }
  }
}

function toUnix(p) { return p.replace(/\\/g, "/"); }
function withDot(rel) { return rel.startsWith(".") ? rel : "./" + rel; }

function computeRel(fromFile) {
  const rel = toUnix(path.relative(path.dirname(fromFile), TARGET_ABS));
  return withDot(rel);
}

function normalizeOne(file) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes("env_guard.mjs")) return false;

  const want = computeRel(file);

  let changed = false;
  const replacer = (_m, a, _oldPath, c) => {
    changed = true;
    return `${a}${want}${c}`;
  };

  let out = text.replace(RX_FROM, replacer);
  out = out.replace(RX_DYN, replacer);

  if (changed && out !== text) {
    fs.writeFileSync(file, out, "utf8");
    return true;
  }
  return false;
}

function main() {
  console.log("🔎  scanning…");
  const files = [];
  walk(process.cwd(), files);

  let updated = 0;
  for (const f of files) {
    if (normalizeOne(f)) {
      updated++;
      console.log(`✅ fixed: ${toUnix(path.relative(process.cwd(), f))}`);
    }
  }
  console.log(`\n✨ done. updated ${updated} file(s).`);
}

main();