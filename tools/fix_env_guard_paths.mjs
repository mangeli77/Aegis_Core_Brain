// tools/fix_env_guard_paths.mjs
import fs from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

const REPO_ROOT = process.cwd();
const TARGET_ABS = path.resolve(REPO_ROOT, "core/voice/utils/env_guard.mjs");
const exts = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx"]);

function listTrackedFiles() {
  const out = execSync("git ls-files -z", { encoding: "utf8" });
  return out
    .split("\0")
    .filter(Boolean)
    .filter((p) => !p.startsWith("node_modules/"))
    .filter((p) => exts.has(path.extname(p)));
}

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

function ensureDotPrefix(rel) {
  // make `foo/bar.mjs` -> `./foo/bar.mjs`
  if (!rel.startsWith(".") && !rel.startsWith("/")) return "./" + rel;
  return rel;
}

function dedupeSegments(p) {
  // collapse /core/core/ or /voice/voice/
  return p.replace(/\/(core|voice)\/\1\//g, "/$1/");
}

function buildReplacer(relPosix) {
  // Match:
  //   import X from '<...env_guard.mjs>';
  //   export * from '<...env_guard.mjs>';
  //   import('<...env_guard.mjs>')
  //   require('<...env_guard.mjs>')
  //
  // We purposely allow anything before env_guard.mjs to replace wrong paths.
  const fromRe = /(from\s*['"])([^'"]*env_guard\.mjs)(['"])/g;
  const exportFromRe = /(export\s+\*\s+from\s*['"])([^'"]*env_guard\.mjs)(['"])/g;
  const dynImportRe = /(import\s*\(\s*['"])([^'"]*env_guard\.mjs)(['"]\s*\))/g;
  const requireRe = /(require\s*\(\s*['"])([^'"]*env_guard\.mjs)(['"]\s*\))/g;

  const replacer = (_m, a, _b, c) => `${a}${relPosix}${c}`;

  return (text) =>
    text
      .replace(fromRe, replacer)
      .replace(exportFromRe, replacer)
      .replace(dynImportRe, replacer)
      .replace(requireRe, replacer);
}

async function fixFile(f) {
  const abs = path.resolve(REPO_ROOT, f);
  let text = await fs.readFile(abs, "utf8");
  if (!/env_guard\.mjs/.test(text)) return { changed: false };

  // Compute correct relative path from this file to TARGET
  let rel = path.relative(path.dirname(abs), TARGET_ABS);
  rel = ensureDotPrefix(toPosix(rel));
  rel = dedupeSegments(rel);

  const apply = buildReplacer(rel);
  let fixed = apply(text);

  // Also de-dupe lingering duplicate segments anywhere in path strings
  fixed = fixed.replace(/\/(core|voice)\/\1\//g, "/$1/");

  if (fixed !== text) {
    await fs.writeFile(abs, fixed, "utf8");
    return { changed: true };
  }
  return { changed: false };
}

async function main() {
  const files = listTrackedFiles();
  let changed = 0;

  for (const f of files) {
    const res = await fixFile(f);
    if (res.changed) {
      changed++;
      console.log("✅ fixed:", f);
    }
  }
  console.log(changed ? `\nDone. Updated ${changed} file(s).`
                      : "\nDone. No changes needed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});