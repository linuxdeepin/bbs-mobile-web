const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTS } = require('./helpers.cjs');
const { renderMarkdown, prepareContent, createMessage } = loadTS('src/utils/markdown.ts');
const { insertMarkdown } = loadTS('src/utils/markdown-edit.ts');
const { parseDocument, DomUtils } = require('htmlparser2');

test('submitted v2 messages include the UTF-8 Markdown source used by the web forum', () => {
  const source = '## 中文 👋\n\n| 列一 | 列二 |\n| --- | --- |\n| 内容 | 内容 |\n\n```sh\nsudo apt update && sudo apt dist-upgrade\n```';
  const root = parseDocument(createMessage(source)).children[0];
  assert.equal(root.attribs['data-editer_version'], 'v2');
  assert.equal(root.attribs.class, 'vditor-reset');
  assert.equal(Buffer.from(root.attribs['data-value'], 'base64').toString('utf8'), source);
  const table = DomUtils.findOne(node => node.name === 'table', root.children);
  assert.equal(DomUtils.findAll(node => node.name === 'td', table.children).length, 2);
  // Rendering a received message does not copy large editor metadata into mini-program views.
  assert.ok(prepareContent(createMessage(source), '').blocks.every(block => !block.html.includes('data-value=')));
});

test('attachments are preserved in both the HTML fallback and the web Markdown source', () => {
  const attachments = ['/uploads/图片 (1).png?x=1&y=2', 'https://example.com/b.png'];
  for (const source of ['**正文**', '', '```sh\necho hi', '~~~', '````js\nconst value = 1;\n```']) {
    const root = parseDocument(createMessage(source, attachments)).children[0];
    const webSource = Buffer.from(root.attribs['data-value'], 'base64').toString('utf8');
    const webHTML = parseDocument(renderMarkdown(webSource));
    const fallbackImages = DomUtils.findAll(node => node.name === 'img', root.children).map(node => node.attribs.src);
    const webImages = DomUtils.findAll(node => node.name === 'img', webHTML.children).map(node => node.attribs.src);
    assert.equal(webImages.length, 2, source);
    assert.deepEqual(fallbackImages, webImages);
    assert.ok(webImages[0].endsWith('.png?x=1&y=2'));
  }
});

test('Markdown source encoding works without browser or Node encoding globals', () => {
  const sandbox = {};
  require('node:vm').runInNewContext(require('node:fs').readFileSync(require.resolve('js-base64'), 'utf8'), sandbox);
  const source = '中文 👋 & <script> 字符\n| 一 | 二 |';
  assert.equal(sandbox.Base64.encode(source), Buffer.from(source, 'utf8').toString('base64'));
});

test('Markdown preserves headings, lists, quotes, code, strikethrough and line breaks', () => {
  const html = renderMarkdown('# 标题\n\n- **粗体**\n- ~~删除~~\n\n> 引用\n\n```js\nif (a < b) console.log("hi")\n```\n\n第一行\n第二行');
  for (const tag of ['h1', 'ul', 'li', 'strong', 's', 'blockquote', 'pre', 'code', 'br']) {
    assert.match(html, new RegExp(`<${tag}(?:>|\\s|/)`));
  }
  assert.match(html, /a &lt; b/);
});

test('Markdown table becomes a separate scrollable rich-text block with aligned cells', () => {
  const content = prepareContent('前文\n\n| 名称 | 数值 |\n| :--- | ---: |\n| 中文 | 42 |\n\n后文', 'https://bbs.example.test');
  assert.deepEqual(Array.from(content.blocks, b => b.type), ['html', 'table', 'html']);
  const table = content.blocks[1];
  assert.equal(table.minWidth, 240);
  assert.match(table.html, /<thead>/);
  assert.match(table.html, /<tbody>/);
  assert.match(table.html, /text-align:right/);
  assert.match(table.html, /border:1px solid/);
  assert.match(table.html, /中文/);
  assert.doesNotMatch(table.html, /&#x/);
});

test('legacy editor HTML retains surrounding content, merged cells and multiple tables', () => {
  const source = '<div data-editer_version="v2"><p>before</p><table><tr><th colspan="3">header</th></tr><tr><td rowspan="2">A</td><td>B</td><td>C</td></tr></table><p>middle</p><table><tr><td>D</td></tr></table><p>after</p></div>';
  const { blocks } = prepareContent(source, 'https://bbs.example.test');
  assert.deepEqual(Array.from(blocks, b => b.type), ['html', 'table', 'html', 'table', 'html']);
  assert.match(blocks[0].html, /before/);
  assert.match(blocks[2].html, /middle/);
  assert.match(blocks[4].html, /after/);
  assert.match(blocks[1].html, /rowspan="2"/);
  assert.equal(blocks[1].minWidth, 360);
});

test('table examples inside fenced code remain code', () => {
  const { blocks } = prepareContent('```html\n<table><tr><td>example</td></tr></table>\n```', '');
  assert.ok(blocks.every(block => block.type === 'html'));
  assert.match(blocks[0].html, /&lt;table&gt;/);
});

test('preview and submitted Markdown cannot inject active HTML or unsafe links', () => {
  const html = renderMarkdown('<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))');
  assert.doesNotMatch(html, /<img|href="javascript:/);
  const legacy = prepareContent('<div><script>alert(1)</script><img src="/x.png" onerror="alert(1)"><a href="java&#x73;cript:alert(1)">bad</a></div>', 'https://bbs.example.test');
  const safe = legacy.blocks.map(block => block.html).join('');
  assert.doesNotMatch(safe, /<script|onerror=|href="javascript:/);
  assert.deepEqual(Array.from(legacy.images), ['https://bbs.example.test/x.png']);
});

test('emoji shortcuts render only in text, while relative attachment URLs resolve correctly', () => {
  const html = renderMarkdown(':agree: `:agree:`');
  assert.equal((html.match(/class="emoji"/g) || []).length, 1);
  assert.match(html, /src="\/assets\/image\/raccoon\/%5Bagree%5D\.gif"/);
  assert.match(html, /<code>:agree:<\/code>/);
  const result = prepareContent(createMessage('**hello**', ['/uploads/a.png']), 'https://bbs.example.test');
  assert.deepEqual(Array.from(result.images), ['https://bbs.example.test/uploads/a.png']);
  assert.match(result.blocks[0].html, /<strong>hello<\/strong>/);
});

test('all forum emoji keep valid image paths after sanitization and submission', () => {
  const names = Object.keys(require('../src/pages/thread/customEmoji.json'));
  const source = names.map(name => `:${name}:`).join(' ');
  const document = parseDocument(createMessage(source));
  const images = DomUtils.findAll(node => node.name === 'img', document.children);
  assert.equal(images.length, names.length);
  for (const image of images) assert.match(image.attribs.src, /^\/assets\/image\/raccoon\/.+\.gif$/);
  assert.match(renderMarkdown(':constructor: :not_an_emoji:'), /:constructor: :not_an_emoji:/);
});

test('stored emoji with missing or bare relative src recover from their known names', () => {
  // The agree markup matches the reply returned by /post/303009.
  const source = '<div data-editer_version="v2"><p><img class="emoji" src alt="agree">' +
    '<img class="extra emoji" src="assets/image/raccoon/[joy].gif" alt="joy">' +
    '<img class="emoji" src="" title=":blush:"><img src="/attachment.png" alt="agree"></p></div>';
  const content = prepareContent(source, 'https://bbs.example.test');
  const images = DomUtils.findAll(node => node.name === 'img', parseDocument(content.blocks[0].html).children);
  assert.deepEqual(images.slice(0, 3).map(node => node.attribs.src), [
    'https://bbs.example.test/assets/image/raccoon/%5Bagree%5D.gif',
    'https://bbs.example.test/assets/image/raccoon/%5Bjoy%5D.gif',
    'https://bbs.example.test/assets/image/raccoon/blush.gif',
  ]);
  for (const image of images.slice(0, 3)) {
    assert.equal(image.attribs.mode, 'aspectFit');
    assert.match(image.attribs.style, /width:24px;height:24px/);
  }
  assert.deepEqual(Array.from(content.images), ['https://bbs.example.test/attachment.png']);
});

test('editor tools replace selected text and retain selection, including Unicode and cursor bounds', () => {
  const edit = insertMarkdown('你好 world', 3, 8, '**', '**', '文字');
  assert.equal(edit.value, '你好 **world**');
  assert.equal(edit.value.slice(edit.start, edit.end), 'world');
  assert.equal(insertMarkdown('你好', 99, 99, '\n## ', '', '标题').value, '你好\n## 标题');
  const table = insertMarkdown('text', 4, 4, '\n\n| A | B |\n| --- | --- |\n');
  assert.equal(table.start, table.value.length);
  assert.match(table.value, /\| A \| B \|\n\| --- \| --- \|/);
});
