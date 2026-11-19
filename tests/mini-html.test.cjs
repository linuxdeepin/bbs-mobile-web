const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTS } = require('./helpers.cjs');

// These compile-time flags enable the published Taro 4.0.4 mini runtime in Node.
for (const flag of ['ENABLE_INNER_HTML', 'ENABLE_ADJACENT_HTML', 'ENABLE_CLONE_NODE',
  'ENABLE_SIZE_APIS', 'ENABLE_TEMPLATE_CONTENT', 'ENABLE_CONTAINS', 'ENABLE_MUTATION_OBSERVER']) {
  global[flag] = true;
}
const runtime = require('@tarojs/runtime');
const { prepareContent } = loadTS('src/utils/markdown.ts');
const { decodeHtmlEntities } = loadTS('src/utils/html-entities.ts');
const { installMiniHtmlEntityDecoding } = loadTS('src/utils/mini-html.ts', { '@tarojs/runtime': runtime });
installMiniHtmlEntityDecoding();

function renderMini(source, format = 'auto') {
  const content = prepareContent(source, 'https://bbs.example.test', format);
  const element = runtime.document.createElement('view');
  element.innerHTML = content.blocks.filter(block => block.type === 'html').map(block => block.html).join('');
  return { element, content };
}
function descendants(element) {
  return element.childNodes.flatMap(child => [child, ...descendants(child)]);
}

test('announcement entities display as Chinese and emoji in the actual mini runtime', () => {
  const source = '<div><p>&#x4eb2;&#x7231;&#x7684; deepin &#x793e;&#x533a;&#x4f19;&#x4f34;&#x4eec;&#xff1a;</p>' +
    '<p>deepin 25.3.0 &#x6b63;&#x5f0f;&#x7248;&#x66f4;&#x65b0;&#x6765;&#x5566;&#xff01;</p>' +
    '<h2>&#x1f680; deepin &#x65b0;&#x7248;&#x672c;&#x4eae;&#x70b9;&#x901f;&#x89c8;</h2>' +
    '<p>sudo apt update &amp;&amp; sudo apt dist-upgrade</p><p>&#128075; &#31038;&#21306;</p></div>';
  const { element, content } = renderMini(source);
  assert.match(element.textContent, /亲爱的 deepin 社区伙伴们：/);
  assert.match(element.textContent, /deepin 25\.3\.0 正式版更新来啦！/);
  assert.match(element.textContent, /🚀 deepin 新版本亮点速览/);
  assert.match(element.textContent, /sudo apt update && sudo apt dist-upgrade/);
  assert.match(element.textContent, /👋 社区/);
  assert.doesNotMatch(content.blocks.map(block => block.html).join(''), /&#(?:x[\da-f]+|\d+);/i);
});

test('raw Unicode survives normal HTML, Markdown and paragraphs surrounding native tables', () => {
  const markdown = renderMini('## 🚀 更新\n\n中文、繁體、café、こんにちは、한글', 'markdown');
  assert.match(markdown.element.textContent, /🚀 更新/);
  assert.match(markdown.element.textContent, /中文、繁體、café、こんにちは、한글/);
  const legacy = renderMini('<div><p>表格前 👋</p><table><tr><th>列一</th><th>列二</th></tr><tr><td>中文</td><td>📌</td></tr></table><p>表格后 🚀</p></div>');
  assert.match(legacy.element.textContent, /表格前 👋/);
  assert.match(legacy.element.textContent, /表格后 🚀/);
  const table = legacy.content.blocks.find(block => block.type === 'table');
  assert.match(table.html, /列一/);
  assert.match(table.html, /中文/);
  assert.match(table.html, /📌/);
});

test('forum emoji use loadable URLs and explicit dimensions in the actual mini runtime', () => {
  for (const [source, format] of [
    [':agree: `:agree:`', 'markdown'],
    ['<div><p><img class="emoji" src alt="agree"></p></div>', 'auto'],
  ]) {
    const { element, content } = renderMini(source, format);
    const images = descendants(element).filter(node => node.nodeName === 'image');
    assert.equal(images.length, 1);
    assert.equal(images[0].getAttribute('src'), 'https://bbs.example.test/assets/image/raccoon/%5Bagree%5D.gif');
    assert.equal(images[0].getAttribute('mode'), 'aspectFit');
    assert.equal(images[0].style.width, '24px');
    assert.equal(images[0].style.height, '24px');
    assert.deepEqual(Array.from(content.images), []);
  }
});

test('named, decimal and hexadecimal entities decode exactly once', () => {
  assert.equal(decodeHtmlEntities('&#x4e2d;&#25991; &amp; &quot; &apos; &nbsp; &copy; &#x1F680;'), '中文 & " \' \u00a0 © 🚀');
  assert.equal(decodeHtmlEntities('&amp;#x4e2d; &amp;lt;b&amp;gt;'), '&#x4e2d; &lt;b&gt;');
  assert.equal(decodeHtmlEntities('a < b && c > d'), 'a < b && c > d');
  assert.equal(decodeHtmlEntities('https://example.test/?a=1&notit=2', true), 'https://example.test/?a=1&notit=2');
  assert.equal(decodeHtmlEntities('A &quot;B&quot; &amp; C', true), 'A "B" & C');
});

test('escaped code stays text, including literal entity examples and script/image markup', () => {
  const result = renderMini('```html\n<script>alert("x")</script>\n<img src=x onerror=alert(1)>\n&#x4e2d; &lt;示例&gt;\n```', 'markdown');
  assert.match(result.element.textContent, /<script>alert\("x"\)<\/script>/);
  assert.match(result.element.textContent, /<img src=x onerror=alert\(1\)>/);
  assert.match(result.element.textContent, /&#x4e2d; &lt;示例&gt;/);
  assert.ok(descendants(result.element).every(node => !['script', 'image', 'img'].includes(node.nodeName)));
  const literal = renderMini('<pre><code>&amp;#x4e2d; &amp;lt;img src=x&amp;gt;</code></pre>');
  assert.equal(literal.element.textContent, '&#x4e2d; &lt;img src=x&gt;');
});

test('mini image and link attributes preserve Unicode, ampersands and quotes', () => {
  const { element } = renderMini('<p><img src="/图片.png?a=1&amp;b=2" alt="图片 &quot;说明&quot;"><a href="https://example.test/?q=中文&amp;page=2" title="标题 &amp; 内容">链接</a></p>');
  const nodes = descendants(element);
  const image = nodes.find(node => node.nodeName === 'image');
  const link = nodes.find(node => node.getAttribute?.('data-tag') === 'a');
  assert.equal(image.getAttribute('src'), 'https://bbs.example.test/图片.png?a=1&b=2');
  assert.equal(image.getAttribute('data-src'), 'https://bbs.example.test/图片.png?a=1&b=2');
  assert.equal(image.getAttribute('alt'), '图片 "说明"');
  assert.equal(link.getAttribute('data-href'), 'https://example.test/?q=中文&page=2');
  assert.equal(link.getAttribute('title'), '标题 & 内容');
});

test('mini HTML hooks install once without double-decoding text on repeated initialization', () => {
  const transformText = runtime.options.html.transformText;
  const transformElement = runtime.options.html.transformElement;
  installMiniHtmlEntityDecoding();
  assert.equal(runtime.options.html.transformText, transformText);
  assert.equal(runtime.options.html.transformElement, transformElement);
  assert.equal(renderMini('<p>&amp;lt;示例&amp;gt;</p>').element.textContent, '&lt;示例&gt;');
});

test('mini decoding preserves existing HTML transform callbacks', () => {
  const calls = [];
  const options = { html: {
    transformText(node) { calls.push(['text', node.textContent]); return node; },
    transformElement(node) { calls.push(['element', node.attrs.title]); return node; },
  } };
  const hook = loadTS('src/utils/mini-html.ts', { '@tarojs/runtime': { options } });
  hook.installMiniHtmlEntityDecoding();
  const text = { textContent: '&#x4e2d;' };
  const element = { attrs: { title: 'A &amp; B' }, getAttribute(name) { return this.attrs[name]; }, setAttribute(name, value) { this.attrs[name] = value; } };
  assert.equal(options.html.transformText(text, {}), text);
  assert.equal(options.html.transformElement(element, {}), element);
  assert.deepEqual(calls, [['text', '中'], ['element', 'A & B']]);
});

test('application startup installs the mini decoder only on mini program builds', () => {
  for (const platform of ['weapp', 'h5']) {
    let installs = 0;
    loadTS('src/app.ts', {
      vue: { createApp: () => ({ use() {} }) }, pinia: { createPinia: () => ({}) }, './app.scss': {},
      '@tarojs/taro': { getSystemInfo: async () => ({ theme: 'light' }), onThemeChange() {} },
      './stores': {
        useConfigStore: () => ({ setTheme() {} }),
        useSubscriptionStore: () => ({ getSetting: async () => {}, getSeverSubscribe: async () => {} }),
      },
      './utils/mini-html': { installMiniHtmlEntityDecoding() { installs++; } },
    }, { TARO_ENV: platform });
    assert.equal(installs, platform === 'weapp' ? 1 : 0);
  }
});
