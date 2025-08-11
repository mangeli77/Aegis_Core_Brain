/**
 * Rewrites ANY import/require path that points to voice/ or cognition/
 * - 'voice/…'            -> 'core/voice/…'
 * - 'cognition/…'        -> 'core/cognition/…'
 * - './voice/…'          -> './core/voice/…'
 * - '../…/voice/…'       -> '../…/core/voice/…'
 * - same for cognition
 * We only touch string literals in import/require.
 */
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const fix = (s) => {
    if (typeof s !== 'string') return s;
    if (s.includes('/core/voice') || s.includes('/core/cognition')) return s;
    // bare
    if (s.startsWith('voice/'))      return s.replace(/^voice\//, 'core/voice/');
    if (s.startsWith('cognition/'))  return s.replace(/^cognition\//, 'core/cognition/');
    // ./ or ../
    s = s.replace(/(^|\/)(\.+\/)*voice\//,     (m) => m.replace('voice/', 'core/voice/'));
    s = s.replace(/(^|\/)(\.+\/)*cognition\//, (m) => m.replace('cognition/', 'core/cognition/'));
    return s;
  };

  // ESM imports/export-from
  root.find(j.ImportDeclaration).forEach(p => { p.value.source.value = fix(p.value.source.value); });
  root.find(j.ExportAllDeclaration).forEach(p => { if (p.value.source) p.value.source.value = fix(p.value.source.value); });
  root.find(j.ExportNamedDeclaration).forEach(p => { if (p.value.source) p.value.source.value = fix(p.value.source.value); });

  // CommonJS
  root.find(j.CallExpression, { callee: { name: 'require' } }).forEach(p => {
    const a = p.value.arguments?.[0];
    if (a && a.type === 'Literal') a.value = fix(a.value);
  });

  return root.toSource({ quote: 'single' });
}