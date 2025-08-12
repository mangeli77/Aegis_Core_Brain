#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'acorn';
import { simple as walk } from 'acorn-walk';

const exts=new Set(['.mjs','.js','.ts']);
const skip=new Set(['node_modules','.git','logs','data']);

const files=[];
(function crawl(d){
  for (const e of fs.readdirSync(d,{withFileTypes:true})) {
    if (skip.has(e.name)) continue;
    const p=path.join(d,e.name);
    if (e.isDirectory()) crawl(p);
    else if (exts.has(path.extname(e.name))) files.push(p);
  }
})(process.cwd());

let changed=0;
for (const file of files){
  const src=fs.readFileSync(file,'utf8');
  let ast; try{ ast=parse(src,{ecmaVersion:'latest',sourceType:'module'});}catch{continue}
  const edits=[];
  walk(ast,{
    ImportDeclaration(n){ edits.push({start:n.source.start,end:n.source.end}) },
    ExportAllDeclaration(n){ edits.push({start:n.source.start,end:n.source.end}) }
  });
  if (!edits.length) continue;

  let out='',last=0,mod=false;
  for (const {start,end} of edits){
    const raw = src.slice(start,end);     // includes quotes
    const spec = raw.slice(1,-1);         // strip quotes
    if (spec.startsWith('../') && spec.includes('/core/')) {
      let aliased = spec.replace(/.*\/core\/voice\/utils\//,'#voice-utils/')
                        .replace(/.*\/core\/voice\//,'#voice/')
                        .replace(/.*\/core\//,'#core/');
      if (aliased!==spec){
        out += src.slice(last,start) + JSON.stringify(aliased);
        last = end; mod=true;
      }
    }
  }
  if (mod){ out += src.slice(last); fs.writeFileSync(file,out,'utf8'); changed++; }
}
console.log(`Rewrote ${changed} file(s) to use aliases`);
