#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'acorn';
import { simple as walk } from 'acorn-walk';

const root = process.cwd();
const skip = new Set(['node_modules','.git','logs','data']);
const exts = new Set(['.mjs','.js','.ts']);
const files=[];

(function crawl(d){
  for (const e of fs.readdirSync(d,{withFileTypes:true})) {
    if (skip.has(e.name)) continue;
    const p = path.join(d,e.name);
    if (e.isDirectory()) crawl(p);
    else if (exts.has(path.extname(e.name))) files.push(p);
  }
})(root);

const bad=[], deepIntoCore=[];
for (const file of files){
  const src=fs.readFileSync(file,'utf8');
  let ast; try{ ast=parse(src,{ecmaVersion:'latest',sourceType:'module'});}catch{continue}
  walk(ast,{
    ImportDeclaration(n){check(file,n.source.value)},
    ExportAllDeclaration(n){check(file,n.source.value)}
  });
}
function check(file,spec){
  if (!spec || typeof spec!=='string') return;
  // Forbid deep relatives into core/** — require aliases
  if (spec.startsWith('../') && spec.includes('/core/')) deepIntoCore.push({file,spec});
  // Only validate resolution for relative paths; aliases/packages are fine
  if (!spec.startsWith('.')) return;
  const base=path.dirname(file);
  const resolved=path.resolve(base,spec);
  const candidates=['','.mjs','.js','.ts','/index.mjs','/index.js','/index.ts'].map(s=>resolved+s);
  if (!candidates.some(fs.existsSync)) bad.push({file,spec});
}

let fail=false;
if (deepIntoCore.length){
  console.error('Alias violations (use #core/* or #voice-utils/* instead of deep relatives):');
  for (const b of deepIntoCore) console.error(` - ${b.file} -> ${b.spec}`);
  fail=true;
}
if (bad.length){
  console.error('Broken relative imports:');
  for (const b of bad) console.error(` - ${b.file} -> ${b.spec}`);
  fail=true;
}
if (fail) process.exit(1);
console.log('✅ Import audit: clean');
