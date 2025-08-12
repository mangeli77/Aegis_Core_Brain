#!/usr/bin/env node
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { CORE_VOICE_OUTPUT_DIR } from '../_env.mjs';

function caps(){
  return {
    os: process.platform,
    cpuThreads: os.cpus().length,
    memGB: Math.round(os.totalmem()/1e9),
  };
}

function latestManifests(root){
  const found=[];
  function walk(d,depth=0){
    if (depth>4) return;
    for (const e of fs.readdirSync(d,{withFileTypes:true})) {
      const p=path.join(d,e.name);
      if (e.isDirectory()) walk(p,depth+1);
      else if (e.isFile() && e.name==='manifest.json') found.push(p);
    }
  }
  try { walk(root); } catch {}
  return found.slice(-5);
}

console.log('=== AEGIS Doctor ===');
console.log('Capabilities:', caps());
console.log('Voice output dir:', CORE_VOICE_OUTPUT_DIR);
console.log('Latest manifests:', latestManifests('core/voice/output'));
console.log('Invariants check:');
await import('./guards/invariants.mjs').catch(()=>{});
