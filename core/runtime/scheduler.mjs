#!/usr/bin/env node
const queue = [];
export function enqueue(job){ queue.push(job); }
export async function run(){ while(queue.length){ const j=queue.shift(); await j(); } }
if (import.meta.url === `file://${process.argv[1]}`) {
  enqueue(async()=>console.log('tick')); run();
}
