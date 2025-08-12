#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
export function writeManifest(relPath, data){
  const abs = path.resolve(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(abs), { recursive:true });
  fs.writeFileSync(abs, JSON.stringify(data, null, 2));
  return abs;
}
