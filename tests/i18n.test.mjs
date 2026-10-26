// Bilingual integrity: every English string has an Arabic twin with the same placeholders, and every t('key') used in source exists.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.js') ? [join(d, e.name)] : []));
const files = walk(join(root, 'js'));

function bundles(src) {
  const out = [];
  let from = 0;
  for (;;) {
    const i = src.indexOf('register({', from);
    if (i < 0) break;
    let depth = 0; let j = i + 'register('.length; let inStr = null; let esc = false;
    for (; j < src.length; j++) {
      const ch = src[j];
      if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === inStr) inStr = null; continue; }
      if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; continue; }
      if (ch === '{') depth++;
      if (ch === '}') { depth--; if (depth === 0) break; }
    }
    out.push(new Function(`return ${src.slice(i + 'register('.length, j + 1)}`)());
    from = j;
  }
  return out;
}
const en = {}; const ar = {};
for (const f of files) for (const b of bundles(readFileSync(f, 'utf8'))) { Object.assign(en, b.en || {}); Object.assign(ar, b.ar || {}); }

test('dictionaries were found', () => assert.ok(Object.keys(en).length > 500, `only ${Object.keys(en).length} English keys`));

test('every English key has an Arabic translation and vice-versa', () => {
  const missingAr = Object.keys(en).filter((k) => !(k in ar));
  const missingEn = Object.keys(ar).filter((k) => !(k in en));
  assert.deepEqual(missingAr, [], `missing Arabic: ${missingAr.slice(0, 15).join(', ')}`);
  assert.deepEqual(missingEn, [], `Arabic-only keys: ${missingEn.slice(0, 15).join(', ')}`);
});

test('placeholders match between languages and no translation is empty', () => {
  const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
  const bad = Object.keys(en).filter((k) => k in ar && (vars(en[k]) !== vars(ar[k]) || !String(ar[k]).trim() || !String(en[k]).trim()));
  assert.deepEqual(bad, [], `placeholder/empty mismatch: ${bad.join(', ')}`);
});

test('every literal t("key") used in source resolves; template keys have at least one match', () => {
  const missing = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\bt\(\s*(['"`])([^'"`]+?)\1/g)) {
      const key = m[2];
      if (m[1] === '`' && key.includes('${')) { const prefix = key.split('${')[0]; if (!Object.keys(en).some((k) => k.startsWith(prefix))) missing.push(`${f}: ${key}`); }
      else if (!(key in en)) missing.push(`${f.replace(root, '')}: ${key}`);
    }
  }
  assert.deepEqual(missing, [], missing.slice(0, 20).join('\n'));
});

test('no gendered Arabic nouns are used for the student team (pronouns must not be inferred from names)', () => {
  const bad = Object.entries(ar).filter(([, v]) => /طالبات|الطالبات/.test(v));
  assert.deepEqual(bad.map(([k]) => k), []);
});

test('the retired product name appears nowhere in the shipped source', () => {
  const hits = files.filter((f) => /NourDx/i.test(readFileSync(f, 'utf8')));
  assert.deepEqual(hits, []);
});
