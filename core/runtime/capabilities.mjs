#!/usr/bin/env node
import os from 'node:os';
export function getCapabilities() {
  const memGB = Math.floor(os.totalmem() / 1e9);
  const cpu = os.cpus()?.length || 1;
  const gpu = process.env.NVIDIA_VISIBLE_DEVICES ? 'nvidia' : null;
  return { memGB, cpu, gpu };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(getCapabilities(), null, 2));
}
