const { test, expect } = require('@playwright/test');

const user = {
  id: 7, nickname: '测试用户', username: 'tester', avatar: '/assets/account.png',
  state: 0, allow_speak: true, group_name: '普通用户', group_id: 1,
  levels: { level_icon: '/assets/account.png' }, threads_cnt: 1, posts_cnt: 1,
};
const legacyBody = '<div data-editer_version="v2"><h2>正文表格</h2><p>表格前的内容</p>' +
  '<table><thead><tr><th>第一列</th><th>第二列</th><th>第三列</th><th>第四列</th><th>第五列</th></tr></thead>' +
  '<tbody><tr><td>单元格一</td><td>单元格二</td><td>单元格三</td><td>单元格四</td><td>最后一列</td></tr></tbody></table>' +
  '<p>表格后的内容</p><pre><code>const answer = 42;</code></pre></div>';
const thread = {
  id: 1, forum_id: 2, user_id: 7, subject: 'Markdown 回归测试', type: { name: '测试' }, user,
  post: { id: 1, user, message: legacyBody }, attrs: [], isclosed: 0, is_poll: 0,
  created_at: '2026-11-13T10:00:00Z', like_cnt: 0, favourite_cnt: 0,
};

async function openReplyEditor(page) {
  await page.getByRole('button', { name: '写回复', exact: true }).click();
  const editor = page.locator('.send-post .markdown-editor');
  await expect(editor).toBeVisible();
  return editor;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('forceLogoutFlag', JSON.stringify({ data: false }));
  });
  // No external request, login, captcha or write reaches the production service.
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.host !== '127.0.0.1:4201') return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    let body;
    switch (url.pathname) {
      case '/api/v1/login/is_login': body = user; break;
      case '/api/v1/thread/info': body = { code: 0, data: thread }; break;
      case '/api/v1/user/info': body = user; break;
      case '/api/v2/public/user/tags': body = []; break;
      case '/api/v1/thread/user/list': body = { code: 0, data: [] }; break;
      case '/api/v1/post/top/list': body = { code: 0, data: [] }; break;
      case '/api/v1/thread/post/list': body = { code: 0, data: [], total_count: 0, total_limit: 10, total_offset: 0 }; break;
      case '/api/v1/user/msg/count': body = { code: 0, data: { at_msg_count: 0, letter_msg_count: 0, post_msg_count: 0, sys_msg_count: 0, thread_msg_count: 0 } }; break;
      case '/api/v1/forum': body = []; break;
      case '/api/v2/public/config/carousel': body = { value: '{"cards":[]}' }; break;
      case '/api/v2/public/config/weixin_share': body = { value: '{"title_max_length":40,"title_suffix":"论坛","default_img":""}' }; break;
      default: return route.fulfill({ status: 404, json: { msg: `Unmocked API: ${url.pathname}` } });
    }
    return route.fulfill({ json: body });
  });
});

test('legacy body tables retain rows and scroll inside a mobile viewport', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/pages/thread/thread?id=1');
  const content = page.locator('.thread-message');
  await expect(content.getByText('表格前的内容')).toBeVisible();
  await expect(content.getByText('表格后的内容')).toBeVisible();
  await expect(content.locator('table tr')).toHaveCount(2);
  await expect(content.locator('table td')).toHaveCount(5);
  await expect(content.locator('pre code')).toHaveText('const answer = 42;');
  const scroll = content.locator('.markdown-table-scroll');
  const measurements = await scroll.evaluate(element => {
    const viewport = [element, ...element.querySelectorAll('*')].find(candidate =>
      candidate.scrollWidth > candidate.clientWidth && ['auto', 'scroll'].includes(getComputedStyle(candidate).overflowX));
    if (!viewport) throw new Error('The wide table needs an actual horizontal scrolling viewport');
    const before = element.querySelector('td:last-child').getBoundingClientRect().left;
    viewport.scrollLeft = viewport.scrollWidth;
    return { outer: element.getBoundingClientRect().width, table: element.querySelector('table').getBoundingClientRect().width,
      page: document.documentElement.scrollWidth, screen: window.innerWidth,
      movement: before - element.querySelector('td:last-child').getBoundingClientRect().left };
  });
  expect(measurements.table).toBeGreaterThan(measurements.outer);
  expect(measurements.movement).toBeGreaterThan(0);
  expect(measurements.page).toBeLessThanOrEqual(measurements.screen + 1);
  expect(errors).toEqual([]);
});

test('reply and private-message editors open on demand and retain drafts when closed', async ({ page }) => {
  await page.route(/\/api\/v1\/user\/letter(?:\?|$)/, route => route.fulfill({ json: {
    code: 0, data: [{ id: 1, from_id: 8, note: '最后一条私信', created_at: thread.created_at, send_user_avatar: user.avatar }],
  } }));
  for (const [url, label] of [
    ['/pages/thread/thread?id=1', '写回复'], ['/pages/dialog/dialog?uid=8', '写私信'],
  ]) {
    await page.goto(url);
    const editor = page.locator('.markdown-composer-panel .markdown-editor');
    await expect(editor).not.toBeVisible();
    const entry = page.locator('.markdown-composer-entry');
    await expect(entry).toBeVisible();
    expect(await entry.evaluate(element => getComputedStyle(element).position)).toBe('static');
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(editor).toBeVisible();
    const draft = `## 保留${label}草稿\n\n**内容**`;
    await editor.locator('textarea').fill(draft);
    await expect(editor.locator('.markdown-live-preview h2')).toHaveText(`保留${label}草稿`);
    await page.getByRole('button', { name: '收起编辑器', exact: true }).click();
    await expect(editor).not.toBeVisible();
    await expect(entry).toContainText(`保留${label}草稿`);
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(editor.locator('textarea')).toHaveValue(draft);
    await page.getByRole('button', { name: '收起编辑器', exact: true }).click();
  }
});

test('replying to the same user reopens the editor after it has been closed', async ({ page }) => {
  const reply = { id: 101, post_user_id: 8, user: { ...user, id: 8, nickname: '回帖用户' },
    message: '<p>原回帖</p>', created_at: thread.created_at, deleted_at: null, like_cnt: 0, is_up: false };
  await page.route(/\/api\/v1\/thread\/post\/list(?:\?|$)/, route => route.fulfill({
    json: { code: 0, data: [reply], total_count: 1, total_limit: 10, total_offset: 0 },
  }));
  await page.goto('/pages/thread/thread?id=1');
  for (let i = 0; i < 2; i++) {
    await page.locator('.post-op').getByText('回复', { exact: true }).click();
    await expect(page.locator('.send-post .markdown-editor')).toBeVisible();
    await expect(page.locator('.send-post .reply-info')).toContainText('回帖用户');
    await page.getByRole('button', { name: '收起编辑器', exact: true }).click();
    await expect(page.locator('.send-post .markdown-editor')).not.toBeVisible();
  }
});

test('entity-encoded announcements retain Chinese, emoji and escaped code in H5', async ({ page }) => {
  const message = '<div><p>&#x4eb2;&#x7231;&#x7684; deepin &#x793e;&#x533a;&#x4f19;&#x4f34;&#x4eec;&#xff1a;</p>' +
    '<h2>&#x1f680; deepin 25.3.0 &#x6b63;&#x5f0f;&#x7248;</h2>' +
    '<pre><code>sudo apt update &amp;&amp; sudo apt dist-upgrade\n&lt;script&gt;alert(1)&lt;/script&gt;</code></pre></div>';
  await page.route(/\/api\/v1\/thread\/info(?:\?|$)/, route => route.fulfill({
    json: { code: 0, data: { ...thread, post: { ...thread.post, message } } },
  }));
  await page.goto('/pages/thread/thread?id=1');
  const content = page.locator('.thread-message');
  await expect(content.getByText('亲爱的 deepin 社区伙伴们：', { exact: true })).toBeVisible();
  await expect(content.locator('h2')).toHaveText('🚀 deepin 25.3.0 正式版');
  await expect(content.locator('pre code')).toHaveText('sudo apt update && sudo apt dist-upgrade\n<script>alert(1)</script>');
  await expect(content.locator('script')).toHaveCount(0);
});

test('forum emoji load in existing posts and live previews at an inline size', async ({ page }) => {
  // A local GIF fixture verifies image decoding without any production request.
  await page.route('https://bbs.deepin.org.cn/assets/image/raccoon/**', route => route.fulfill({
    contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64'),
  }));
  const message = '<div data-editer_version="v2"><p><img class="emoji" src alt="agree"></p></div>';
  await page.route(/\/api\/v1\/thread\/info(?:\?|$)/, route => route.fulfill({
    json: { code: 0, data: { ...thread, post: { ...thread.post, message } } },
  }));
  await page.goto('/pages/thread/thread?id=1');
  const stored = page.locator('.thread-message img.emoji');
  await expect(stored).toHaveAttribute('src', 'https://bbs.deepin.org.cn/assets/image/raccoon/%5Bagree%5D.gif');
  await expect.poll(() => stored.evaluate(image => image.naturalWidth)).toBe(1);
  expect((await stored.boundingBox()).width).toBe(24);
  expect((await stored.boundingBox()).height).toBe(24);
  const editor = await openReplyEditor(page);
  await editor.locator('textarea').fill(':agree: :joy: `:agree:`');
  const preview = editor.locator('.markdown-live-preview');
  await expect(preview.locator('img.emoji')).toHaveCount(2);
  await expect.poll(() => preview.locator('img.emoji').evaluateAll(images => images.every(image => image.naturalWidth === 1))).toBe(true);
  await expect(preview.locator('code')).toHaveText(':agree:');
});

test('reply editor previews Markdown tables/code and preserves its draft when returning to edit', async ({ page }) => {
  await page.goto('/pages/thread/thread?id=1');
  const editor = await openReplyEditor(page);
  const input = editor.locator('textarea');
  await expect(input).toBeEditable();
  const draft = '## 回复标题\n\n| A | B |\n| --- | --- |\n| 一 | 二 |\n\n```js\nconst value = 1;\n```';
  await input.fill(draft);
  await editor.getByRole('button', { name: '预览', exact: true }).click();
  await expect(editor.locator('h2')).toHaveText('回复标题');
  await expect(editor.locator('table')).toBeVisible();
  await expect(editor.locator('pre code')).toHaveText('const value = 1;\n');
  await editor.getByRole('button', { name: '编辑', exact: true }).click();
  await expect(input).toHaveValue(draft);
  await page.getByRole('button', { name: '收起编辑器', exact: true }).click();
  await expect(editor).not.toBeVisible();
  await openReplyEditor(page);
  await expect(input).toHaveValue(draft);
});

test('format toolbar inserts a table and wraps the current selection', async ({ page }) => {
  await page.goto('/pages/thread/thread?id=1');
  const editor = await openReplyEditor(page);
  const input = editor.locator('textarea');
  await expect(input).toBeEditable();
  await input.fill('hello world');
  await input.evaluate(element => { element.focus(); element.setSelectionRange(6, 11); element.dispatchEvent(new Event('select', { bubbles: true })); });
  await editor.getByRole('button', { name: '加粗', exact: true }).click();
  await expect(input).toHaveValue('hello **world**');
  await editor.getByRole('button', { name: '表格', exact: true }).click();
  await expect(input).toHaveValue(/\| 列一 \| 列二 \|/);
});

test('writing renders a live preview without leaving the input or losing the draft', async ({ page }) => {
  await page.goto('/pages/thread/thread?id=1');
  const editor = await openReplyEditor(page);
  const input = editor.locator('textarea');
  const live = editor.locator('.markdown-live-preview');
  const draft = '## 边写边看\n\n**加粗文字**\n\n| 中文 | 效果 |\n| --- | --- |\n| 正文 | 完整 |\n\n```sh\nsudo apt update && sudo apt dist-upgrade\n```\n\n[示例链接](https://example.com)';
  await input.fill(draft);
  await expect(live.locator('h2')).toHaveText('边写边看');
  await expect(live.locator('strong')).toHaveText('加粗文字');
  await expect(live.locator('table td')).toHaveText(['正文', '完整']);
  await expect(live.locator('pre code')).toHaveText('sudo apt update && sudo apt dist-upgrade\n');
  await expect(input).toHaveValue(draft);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const composerBounds = await page.locator('.send-post').boundingBox();
    const editorBounds = await editor.boundingBox();
    expect(editorBounds.x + editorBounds.width).toBeLessThanOrEqual(composerBounds.x + composerBounds.width + 1);
    await expect(editor.getByRole('button', { name: '预览', exact: true })).toBeInViewport({ ratio: 1 });
    await expect(page.locator('.send-post .send-btn')).toBeInViewport({ ratio: 1 });
  }
  await page.locator('.send-post').screenshot({ path: test.info().outputPath('live-preview.png') });
  await live.locator('a').click();
  await expect(page).toHaveURL(/\/pages\/thread\/thread\?id=1$/);
  await live.getByRole('button', { name: '收起', exact: true }).click();
  await expect(live.locator('.markdown-content')).toHaveCount(0);
  await expect(input).toHaveValue(draft);
  await live.getByRole('button', { name: '展开', exact: true }).click();
  await input.fill('## 更新后的标题');
  await expect(live.locator('h2')).toHaveText('更新后的标题');
  await expect(live.locator('table')).toHaveCount(0);
  await input.fill('');
  await expect(live).toHaveCount(0);
});

test('thread composer provides the same Markdown preview', async ({ page }) => {
  await page.goto('/pages/posting/posting');
  const editor = page.locator('.posting-page .markdown-editor');
  const input = editor.locator('textarea');
  await expect(input).toBeEditable();
  await input.fill('**发帖预览**\n\n| A | B |\n| --- | --- |\n| 1 | 2 |');
  await editor.getByRole('button', { name: '预览', exact: true }).click();
  await expect(editor.locator('strong')).toHaveText('发帖预览');
  await expect(editor.locator('table td')).toHaveCount(2);
});
