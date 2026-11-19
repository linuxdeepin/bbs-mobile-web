const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function source(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  return file.endsWith('.vue') ? text.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1] : text;
}
function find(file, predicate) {
  const tree = ts.createSourceFile(file, source(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let found;
  function visit(node) {
    if (!found && predicate(node, tree)) found = node;
    if (!found) ts.forEachChild(node, visit);
  }
  visit(tree);
  if (!found) throw new Error(`Missing source node: ${file}`);
  return found;
}
function evaluate(code, scope = {}) {
  const js = ts.transpileModule(code, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  }}).outputText;
  return vm.runInNewContext(js, { console, Error, setTimeout, clearTimeout, ...scope });
}
function bindings(file, names, scope) {
  const declarations = names.map(name => {
    const node = find(file, n => ts.isVariableDeclaration(n) && n.name.getText() === name);
    return `const ${name} = ${node.initializer.getText()};`;
  }).join('\n');
  return evaluate(`${declarations}\n;({${names.join(',')}})`, scope);
}
function loadTS(file, mocks = {}, env = {}) {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const localRequire = createRequire(filename);
    const requireMock = request => {
      if (Object.hasOwn(mocks, request)) return mocks[request];
      let resolved;
      if (request.startsWith('@/')) resolved = path.join(root, 'src', request.slice(2));
      else if (request.startsWith('.')) resolved = path.resolve(path.dirname(filename), request);
      if (resolved && fs.existsSync(`${resolved}.ts`)) return load(`${resolved}.ts`);
      return localRequire(resolved || request);
    };
    const js = ts.transpileModule(source(path.relative(root, filename)), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
    }}).outputText;
    // Run dependencies and their RegExp options in one realm (cssfilter checks instanceof RegExp).
    new Function('module', 'exports', 'require', 'process', js)(
      module, module.exports, requireMock,
      { env: { SERVER: 'https://bbs.example.test', TARO_ENV: 'h5', ...env } },
    );
    return module.exports;
  }
  return load(path.join(root, file));
}
function promptSpy() {
  const messages = [];
  return { messages, showToast(...args) { messages.push(args); }, hideToast() {} };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
module.exports = { root, source, find, evaluate, bindings, loadTS, promptSpy, deferred };
