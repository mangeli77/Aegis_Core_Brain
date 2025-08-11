cat > tools/relativize-any-core-imports.mjs <<'JS'
import path from 'node:path';

export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const projectRoot = process.cwd();

  const fixSpec = (spec) => {
    if (!spec || typeof spec.value !== 'string') return;
    const s = spec.value;
    const idx = s.indexOf('core/');
    if (idx < 0) return;                      // only touch specs that *contain* 'core/'
    const tail = s.slice(idx);                 // normalize to 'core/…'
    const targetAbs = path.resolve(projectRoot, tail);
    const fromDir = path.dirname(file.path);
    let rel = path.relative(fromDir, targetAbs).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    // collapse things like '././' if they appear
    rel = rel.replace(/\/\.\//g, '/');
    spec.value = rel;
  };

  // ESM: import … from '…'
  root.find(j.ImportDeclaration).forEach(p => fixSpec(p.value.source));

  // ESM: export … from '…'
  root.find(j.ExportAllDeclaration).forEach(p => p.value.source && fixSpec(p.value.source));
  root.find(j.ExportNamedDeclaration).forEach(p => p.value.source && fixSpec(p.value.source));

  // CJS: require('…')
  root.find(j.CallExpression, { callee: { name: 'require' } }).forEach(p => {
    const a = p.value.arguments?.[0];
    if (a && (a.type === 'Literal' || a.type === 'StringLiteral')) fixSpec(a);
  });

  return root.toSource({ quote: 'single' });
}
JS