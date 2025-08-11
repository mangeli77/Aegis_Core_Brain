#!/usr/bin/env node
/**
 * Codemod: Upgrade requireEnv()/summarizeEnv() varargs → array style.
 * - requireEnv(['A','B'])  -> requireEnv(['A','B'])
 * - summarizeEnv('A','B')-> summarizeEnv(['A','B'])
 * Skips calls already using array literal.
 * Creates .bak.envimport backups.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DRY = process.env.DRY?.toString() === '1';
const repoRoot = process.cwd();

// Glob-light walk (avoid bringing heavy deps)
const IGNORE_DIRS = new Set(['node_modules', '.git', 'aegis-tts-env']);
const exts = new Set(['.mjs', '.js']);

function* walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.has(name)) yield* walk(full);
      continue;
    }
    if (exts.has(path.extname(name))) yield full;
  }
}

// basic matcher: functionName('x','y','z')
// excludes array calls: functionName([ ... ])
const mkRegex = (fn) =>
  new RegExp(
    String.raw`${fn}\s*$begin:math:text$\\s*(?!\\[)\\s*([^()]*?)\\s*$end:math:text$`,
    'g'
  );

// split args by commas but keep quotes / spaces
function splitArgs(argString) {
  // crude but safe enough for simple string literal lists
  // trims outer whitespace; splits on commas not inside quotes
  const parts = [];
  let buf = '', inS = false, inD = false;

  for (let i = 0; i < argString.length; i++) {
    const c = argString[i];
    if (c === "'" && !inD) { inS = !inS; buf += c; continue; }
    if (c === '"' && !inS) { inD = !inD; buf += c; continue; }
    if (c === ',' && !inS && !inD) {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
      continue;
    }
    buf += c;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts.filter(Boolean);
}

function upgradeContent(src) {
  let changed = false;

  const replaceFn = (fnName, _match, argsGroup, offset, full) => {
    // If args already start with [, skip
    const pre = full.slice(0, offset);
    const matchOpen = `${fnName}(`;
    const fromIdx = pre.lastIndexOf(matchOpen);
    const openIdx  = fromIdx + matchOpen.length;

    if (full.slice(openIdx).trimStart().startsWith('[')) {
      return _match; // already array
    }

    const args = splitArgs(argsGroup);
    if (args.length === 0) return _match; // nothing to do

    changed = true;
    return `${fnName}([${args.join(', ')}])`;
  };

  // Apply for requireEnv and summarizeEnv
  src = src.replace(mkRegex('requireEnv'), function (...a) {
    return replaceFn('requireEnv', ...a);
  });
  src = src.replace(mkRegex('summarizeEnv'), function (...a) {
    return replaceFn('summarizeEnv', ...a);
  });

  return { src, changed };
}

let totalFiles = 0, changedFiles = 0;

for (const file of walk(repoRoot)) {
  totalFiles++;
  const orig = fs.readFileSync(file, 'utf8');
  const { src, changed } = upgradeContent(orig);
  if (!changed) continue;

  changedFiles++;
  const bak = `${file}.bak.envimport`;
  console.log(`• ${file}`);
  if (!DRY) {
    fs.writeFileSync(bak, orig);
    fs.writeFileSync(file, src);
  } else {
    console.log('  (dry-run) would update + write backup:', bak);
  }
}

console.log(`\nDone. Scanned ${totalFiles} files. Updated ${changedFiles}. ${DRY ? '(dry-run)': ''}`);