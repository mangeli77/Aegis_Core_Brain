#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { CORE_VOICE_DIR } from '../../_env.mjs';

let changed=false;
const ROOT = process.cwd();

// Heal stray ./voice/ dir
const ROOT_VOICE = path.join(ROOT,'voice');
if (fs.existsSync(ROOT_VOICE) && fs.lstatSync(ROOT_VOICE).isDirectory()){
  fs.mkdirSync(CORE_VOICE_DIR,{recursive:true});
  for (const n of fs.readdirSync(ROOT_VOICE)) {
    const from=path.join(ROOT_VOICE,n);
    const to=path.join(CORE_VOICE_DIR,n);
    fs.rmSync(to,{recursive:true,force:true});
    fs.renameSync(from,to);
  }
  fs.rmSync(ROOT_VOICE,{recursive:true,force:true});
  console.error('[invariants] Healed stray ./voice -> core/voice/');
  changed=true;
}

// Forbid runtime code outside core/**
function scanForRuntimeOutsideCore(){
  const bad=[];
  function walk(d){
    for (const e of fs.readdirSync(d,{withFileTypes:true})) {
      if (['node_modules','.git','logs','data','tools','jobs','docs'].includes(e.name)) continue;
      const p=path.join(d,e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(mjs|js|ts)$/.test(e.name) && !p.includes(path.sep+'core'+path.sep)) {
        // scripts are fine; treat anything under scripts/ as disposable
        if (!p.includes(path.sep+'scripts'+path.sep)) bad.push(p);
      }
    }
  }
  walk(ROOT);
  return bad;
}
const offenders=scanForRuntimeOutsideCore();
if (offenders.length){
  console.error('[invariants] Runtime code found outside core/:');
  offenders.forEach(p=>console.error(' - '+p));
  process.exit(2);
}

if (!changed) console.log('[invariants] OK');
