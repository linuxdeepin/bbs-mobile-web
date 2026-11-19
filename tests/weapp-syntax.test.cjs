const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkWeappSyntax } = require('../scripts/check-weapp-syntax.cjs');
const { bindings } = require('./helpers.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bbs-weapp-syntax-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('Markdown transpilation matches dependency paths on Windows, Unix and pnpm installs', () => {
  const { markdownDependencies } = bindings('config/index.ts', ['markdownDependencies']);
  const htmlRequire = require('node:module').createRequire(require.resolve('htmlparser2'));
  const markdownRequire = require('node:module').createRequire(require.resolve('markdown-it'));
  const filenames = [
    require.resolve('htmlparser2'), require.resolve('markdown-it'), require.resolve('js-base64'),
    htmlRequire.resolve('domhandler'), htmlRequire.resolve('entities'),
    markdownRequire.resolve('linkify-it'),
    '/project/node_modules/domutils/dist/index.js',
  ];
  for (const filename of filenames) {
    assert.equal(markdownDependencies.test(filename), true, filename);
    const windows = filename.replace(/\//g, '\\');
    assert.equal(markdownDependencies.test(windows), true, windows);
  }
  assert.equal(markdownDependencies.test('/project/src/utils/markdown.ts'), false);
});

test('upload syntax check reports class fields and modern assignment syntax in every chunk', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'pages'));
  fs.writeFileSync(path.join(root, 'vendors.js'), 'class Node { parent = null; }');
  fs.writeFileSync(path.join(root, 'pages/logical.js'), 'const cache = {}; cache.value ??= 1;');
  fs.writeFileSync(path.join(root, 'pages/private.js'), 'class Node { #value = 0; }');
  fs.writeFileSync(path.join(root, 'pages/optional.js'), 'const value = object?.value;');
  const result = checkWeappSyntax(root);
  assert.equal(result.count, 4);
  assert.equal(result.errors.length, 4);
  assert.deepEqual(result.errors.map(error => error.file), [
    'pages/logical.js', 'pages/optional.js', 'pages/private.js', 'vendors.js',
  ]);
  assert.ok(result.errors.every(error => error.line === 1 && error.column > 0));
});

test('upload syntax check accepts supported JavaScript and syntax examples inside strings', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'assets'));
  fs.writeFileSync(path.join(root, 'app.js'), 'const run = async () => { const {value, ...rest} = {}; return rest; };');
  fs.writeFileSync(path.join(root, 'assets/example.js'), 'const text = "class Node { parent = null; } ??= ?."; // cache ??= 1');
  fs.writeFileSync(path.join(root, 'app.wxss'), 'not JavaScript');
  assert.deepEqual(checkWeappSyntax(root), { count: 2, errors: [] });
});

test('upload syntax check fails for a missing or empty build instead of reporting success', t => {
  const root = fixture(t);
  assert.throws(() => checkWeappSyntax(root), /No mini-program JavaScript/);
  assert.throws(() => checkWeappSyntax(path.join(root, 'missing')), /ENOENT/);
});
