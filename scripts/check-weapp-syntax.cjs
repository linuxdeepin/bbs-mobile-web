const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('acorn');

// Keep upload artifacts below class fields, logical assignment and optional chaining.
const ecmaVersion = 2019;

function checkWeappSyntax(directory) {
  const root = path.resolve(directory);
  const files = [];
  const errors = [];
  function visit(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const filename = path.join(folder, entry.name);
      if (entry.isDirectory()) visit(filename);
      else if (entry.isFile() && entry.name.endsWith('.js')) files.push(filename);
    }
  }
  visit(root);
  if (!files.length) throw new Error(`No mini-program JavaScript found in ${root}`);
  for (const filename of files.sort()) {
    try {
      parse(fs.readFileSync(filename, 'utf8'), { ecmaVersion, sourceType: 'script' });
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      errors.push({
        file: path.relative(root, filename).split(path.sep).join('/'),
        line: error.loc.line,
        column: error.loc.column,
        message: error.message,
      });
    }
  }
  return { count: files.length, errors };
}

if (require.main === module) {
  try {
    const result = checkWeappSyntax(process.argv[2] || path.resolve(__dirname, '../dist/weapp'));
    if (result.errors.length) {
      for (const error of result.errors) {
        console.error(`${error.file}:${error.line}:${error.column} ${error.message}`);
      }
      process.exitCode = 1;
    } else {
      console.log(`Mini-program syntax check passed: ${result.count} JavaScript files (ES${ecmaVersion}).`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { checkWeappSyntax };
