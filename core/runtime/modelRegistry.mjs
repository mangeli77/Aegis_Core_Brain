#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const REG = path.join(root, 'core', 'models', 'registry.json');

export function loadRegistry() {
  if (!fs.existsSync(REG)) return { models: {} };
  return JSON.parse(fs.readFileSync(REG, 'utf8'));
}
export function resolvePath(p) {
  return path.resolve(root, p.replace(/^~\//, `${process.env.HOME}/`));
}

export function validateRegistry({ models } = loadRegistry()) {
  const errors = [];
  for (const [name, m] of Object.entries(models || {})) {
    const abs = resolvePath(m.path || '');
    if (!abs || !fs.existsSync(abs)) { errors.push(`✖ ${name}: missing file ${abs}`); continue; }
    if (m.sha256 && m.sha256.length >= 16) {
      try {
        const h = crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
        if (h !== m.sha256) errors.push(`✖ ${name}: sha mismatch have ${h.slice(0,8)} want ${m.sha256.slice(0,8)}`);
      } catch (e) { errors.push(`✖ ${name}: sha error ${e.message}`); }
    }
  }
  return errors;
}

export function selectModel(task, caps, registry = loadRegistry()) {
  const candidates = Object.entries(registry.models || {})
    .filter(([, m]) => m.type === task)
    .sort((a,b) => (b[1].quality||0) - (a[1].quality||0));
  for (const [name, m] of candidates) {
    const okMem = !m.min_caps?.memGB || (caps.memGB||0) >= m.min_caps.memGB;
    if (okMem) return { name, path: resolvePath(m.path), meta: m };
  }
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const reg = loadRegistry();
  const errs = validateRegistry(reg);
  if (errs.length) { console.error(errs.join('\n')); process.exit(2); }
  console.log(`OK: ${Object.keys(reg.models||{}).length} models registered.`);
}
