#!/usr/bin/env node
export async function route(task, payload, { goal, options } = {}) {
  return { ok: true, task, goal: goal||task, used: {}, meta: {}, echo: payload };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const task = process.argv[2] || 'demo';
  const res = await route(task, { ping: true }, { goal: 'smoke' });
  console.log(JSON.stringify(res, null, 2));
}

export default route;
