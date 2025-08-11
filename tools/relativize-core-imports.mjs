// Convert imports like "core/voice/..." to relative paths based on the current file.
// Works for both ESM (import/export-from) and CJS (require).
import path from 'node:path';
import fs from 'node:fs';

export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const projectRoot = process.cwd(); // repo root (where you run jscodeshift)
  const toRel = (fromFile, spec) => {
    if (typeof spec !== 'string') return spec;
    if (!spec.startsWith('core/')) return spec; // only touch core/...
    // Absolute target on disk for the spec:
    const targetAbs = path.resolve(projectRoot, spec); // e.g., /repo/core/voice/...
    // Current file’s directory:
    const fromDir = path.dirname(file.path);          // e.g., core/voice/utils
    const rel = path.relative(fromDir, targetAbs);    // eg: ./env_guard.mjs or ../voice/...
    // Ensure relative form starts with ./ or ../
    return rel.startsWith('.') ? rel : `./${rel}`;
  };

  const fixLiteral = (lit) => {
    if (!lit) return;
    if (lit.type === 'Literal' && typeof lit.value === 'string') {
      lit.value = toRel(file.path, lit.value);
    } else if (lit.type === 'StringLiteral') {
      lit.value = toRel(file.path, lit.value);
    }
  };

  // import ... from '...'
  root.find(j.ImportDeclaration).forEach(p => fixLiteral(p.value.source));

  // export ... from '...'
  root.find(j.ExportAllDeclaration).forEach(p => p.value.source && fixLiteral(p.value.source));
  root.find(j.ExportNamedDeclaration).forEach(p => p.value.source && fixLiteral(p.value.source));

  // require('...')
  root.find(j.CallExpression, { callee: { name: 'require' } }).forEach(p => {
    const a = p.value.arguments?.[0];
    if (a && (a.type === 'Literal' || a.type === 'StringLiteral')) fixLiteral(a);
  });

  return root.toSource({ quote: 'single' });
}