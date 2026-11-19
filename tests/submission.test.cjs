const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ref, watch } = require('vue');
const ts = require('typescript');
const { loadTS, bindings, find, evaluate, promptSpy, deferred } = require('./helpers.cjs');
const { createSubmissionGuard, submissionFingerprint, REPLY_MAX_LENGTH, THREAD_MAX_LENGTH } = loadTS('src/utils/submission.ts', { '@tarojs/taro': {} });
const { requestErrorMessage } = loadTS('src/utils/errors.ts');

function setupGuard() {
  let time = 100_000;
  const data = new Map();
  const storage = { get: key => data.get(key), set: (key, value) => data.set(key, structuredClone(value)) };
  return { guard: createSubmissionGuard(storage, () => time), storage, advance: ms => { time += ms; }, now: () => time };
}

test('in-flight submission locks all composers for the same account, failure allows retry', () => {
  const { guard } = setupGuard();
  const finish = guard.begin(7, 'first');
  assert.throws(() => guard.begin(7, 'second'), /正在发送/);
  assert.doesNotThrow(() => guard.begin(8, 'first')(false));
  finish(false);
  assert.equal(guard.remainingSeconds(7), 0);
  assert.doesNotThrow(() => guard.begin(7, 'first')(false));
});

test('success enforces 10-second cooldown and 60-second duplicate window across remounts', () => {
  const { guard, storage, advance, now } = setupGuard();
  guard.begin(7, 'first')(true);
  assert.equal(guard.remainingSeconds(7), 10);
  assert.throws(() => guard.check(7, 'second'), /10秒/);
  assert.throws(() => guard.check(7, 'first'), /重复发送/);
  advance(10_000);
  const remounted = createSubmissionGuard(storage, now);
  assert.equal(remounted.remainingSeconds(7), 0);
  assert.doesNotThrow(() => remounted.check(7, 'second'));
  assert.throws(() => remounted.check(7, 'first'), /重复发送/);
  advance(50_000);
  assert.doesNotThrow(() => remounted.check(7, 'first'));
});

test('finishing twice is harmless and unavailable storage retains in-memory protection', () => {
  const guard = createSubmissionGuard({ get() { throw new Error('unavailable'); }, set() { throw new Error('full'); } }, () => 100_000);
  const finish = guard.begin(7, 'first');
  finish(true); finish(false); finish(true);
  assert.throws(() => guard.check(7, 'first'), /重复发送/);
  assert.equal(guard.remainingSeconds(7), 10);
});

test('malformed stored entries do not block sending or discard valid duplicate history', () => {
  const guard = createSubmissionGuard({
    get: () => ({ lastSentAt: 90_000, entries: [null, 3, 'invalid', {}, { fingerprint: 'sent', sentAt: 90_000 }] }),
    set() {},
  }, () => 100_000);
  assert.doesNotThrow(() => guard.check(7, 'new'));
  assert.throws(() => guard.check(7, 'sent'), /重复发送/);
});

test('fingerprints normalize surrounding whitespace/line endings and distinguish thread and attachments', () => {
  const hash = submissionFingerprint('reply:1', ' hello\r\nworld ', []);
  assert.equal(hash, submissionFingerprint('reply:1', 'hello\nworld', []));
  assert.notEqual(hash, submissionFingerprint('reply:2', 'hello\nworld', []));
  assert.notEqual(hash, submissionFingerprint('reply:1', 'hello\nworld', ['image.png']));
});

function composer(options = {}) {
  const guard = setupGuard();
  const pending = deferred();
  const requests = [], events = [];
  const scope = {
    account: { is_login: true, user_info: { id: 7 } }, msg: ref('**hello**'), chooseImgList: ref([]),
    props: { info: { id: 1, forum_id: 2, user_id: 3 }, replyInfo: { isReply: false } },
    submitting: ref(false), showEmojiList: ref(false), editorVisible: ref(true), editorSession: ref(0), prompt: promptSpy(),
    submissionGuard: guard.guard, submissionFingerprint, REPLY_MAX_LENGTH, requestErrorMessage,
    postCaptcha: { captchaID: 'test', tryVerify: callback => callback('test') },
    uploadImage: async file => `/uploaded/${file}`, createMessage: text => `<p>${text}</p>`,
    CreateThreadPost: async body => { requests.push(body); return pending.promise; },
    emit: (...event) => events.push(event), ...options,
  };
  const methods = bindings('src/pages/thread/send-post.vue', ['snapshot', 'fingerprint', 'validate', 'submitPost', 'requestPost'], scope);
  return { ...guard, scope, methods, requests, events, pending };
}

test('repeated send/captcha callbacks produce one request, then clear only the successful draft', async () => {
  const { scope, methods, requests, pending, guard, events } = composer();
  const draft = methods.snapshot();
  const first = methods.submitPost('test', draft);
  const second = methods.submitPost('test', draft);
  assert.equal(requests.length, 1);
  assert.equal(scope.submitting.value, true);
  pending.resolve({ data: { code: 0 } });
  await Promise.all([first, second]);
  assert.equal(scope.submitting.value, false);
  assert.equal(scope.msg.value, '');
  assert.equal(events.length, 1);
  assert.equal(guard.remainingSeconds(7), 10);
  scope.msg.value = '**hello**';
  await methods.requestPost();
  assert.equal(requests.length, 1);
  assert.match(scope.prompt.messages.at(-1)[1], /重复发送/);
});

test('failed reply preserves text/images, unlocks, and does not consume the cooldown', async () => {
  const { scope, methods, pending, guard } = composer({ chooseImgList: ref(['a.png']) });
  const sent = methods.submitPost('test', methods.snapshot());
  pending.reject(new Error('发送失败'));
  await sent;
  assert.equal(scope.msg.value, '**hello**');
  assert.deepEqual(scope.chooseImgList.value, ['a.png']);
  assert.equal(scope.submitting.value, false);
  assert.equal(guard.remainingSeconds(7), 0);
  assert.doesNotThrow(() => guard.check(7, methods.fingerprint(methods.snapshot())));
});

test('closing the reply editor cancels a pending captcha callback without losing its draft', async () => {
  const { scope, methods, requests } = composer();
  const draft = methods.snapshot();
  scope.editorVisible.value = false;
  await methods.submitPost('late-captcha', draft);
  assert.equal(requests.length, 0);
  assert.equal(scope.msg.value, '**hello**');
});

test('reopening the editor cannot revive an earlier captcha callback or send its old draft', async t => {
  const callbacks = [];
  const { scope, methods, requests, pending } = composer({
    postCaptcha: { captchaID: 'test', tryVerify: callback => { callbacks.push(callback); } },
  });
  const hook = find('src/pages/thread/send-post.vue', node => ts.isCallExpression(node) &&
    node.expression.getText() === 'watch' && node.arguments[0]?.getText() === 'editorVisible');
  t.after(evaluate(hook.getText(), { watch, editorVisible: scope.editorVisible, editorSession: scope.editorSession }));
  await methods.requestPost();
  scope.editorVisible.value = false;
  scope.msg.value = '重新打开后的草稿';
  scope.editorVisible.value = true;
  await callbacks[0]('old-captcha');
  assert.equal(requests.length, 0);
  assert.equal(scope.msg.value, '重新打开后的草稿');
  await methods.requestPost();
  const sending = callbacks[1]('new-captcha');
  assert.equal(requests.length, 1);
  assert.match(requests[0].message, /重新打开后的草稿/);
  pending.resolve({ data: { code: 0 } });
  await sending;
});

test('empty, oversized and over-attachment replies are rejected before the captcha/API', async () => {
  const { methods, scope, requests } = composer();
  for (const [text, images, message] of [['  \n', [], /不能为空/], ['字'.repeat(1001), [], /不能超过/], ['', Array(6).fill('x'), /最多添加/]]) {
    scope.msg.value = text;
    scope.chooseImgList.value = images;
    await methods.requestPost();
    assert.match(scope.prompt.messages.at(-1)[1], message);
  }
  assert.equal(requests.length, 0);
});

test('HTTP throttling and expired sessions produce readable messages without losing the draft', async () => {
  for (const [status, expected] of [[429, /发送过于频繁/], [401, /登录已失效/]]) {
    const { scope, methods, pending } = composer();
    const sent = methods.submitPost('test', methods.snapshot());
    pending.reject({ isAxiosError: true, response: { status } });
    await sent;
    assert.match(scope.prompt.messages.at(-1)[1], expected);
    assert.equal(scope.msg.value, '**hello**');
    assert.equal(scope.submitting.value, false);
  }
});

test('captcha draft snapshots preserve the original recipient and do not clear newer edits/attachments', async () => {
  const { scope, methods, pending, requests, events } = composer({ chooseImgList: ref(['a.png']) });
  scope.props.replyInfo = { isReply: true, replyId: 4, replyUserId: 9 };
  const draft = methods.snapshot();
  scope.msg.value = 'new draft';
  scope.chooseImgList.value = ['a.png', 'b.png'];
  scope.props.replyInfo = { isReply: true, replyId: 5, replyUserId: 10 };
  const sent = methods.submitPost('test', draft);
  pending.resolve({ data: { code: 0 } });
  await sent;
  assert.equal(requests[0].quote_post_id, 4);
  assert.equal(requests[0].quote_user_id, 9);
  assert.equal(scope.msg.value, 'new draft');
  assert.deepEqual(scope.chooseImgList.value, ['b.png']);
  assert.equal(events[0][1], 4);
  let cancelled = false;
  const { sendPost } = bindings('src/pages/thread/thread.vue', ['sendPost'], {
    replyInfo: ref({ isReply: true, replyId: 5 }), threadPosts: ref(), cancelReply() { cancelled = true; },
  });
  sendPost(events[0][1]);
  assert.equal(cancelled, false);
});

test('image picker reserves remaining slots and validates every selected image', async () => {
  const images = ref(['a', 'b', 'c']);
  const prompt = promptSpy();
  let count;
  const { chooseImage } = bindings('src/pages/thread/send-post.vue', ['chooseImage'], {
    submitting: ref(false), chooseImgList: images, prompt, isChooseImage: ref(false), MAX_IMAGE_SIZE: 2 * 1024 * 1024,
    Taro: { chooseImage: async options => {
      count = options.count;
      return { tempFilePaths: ['d', 'e'], tempFiles: [{ size: 1 }, { size: 3 * 1024 * 1024 }] };
    } },
  });
  await chooseImage();
  assert.equal(count, 2);
  assert.deepEqual(images.value, ['a', 'b', 'c']);
  assert.match(prompt.messages.at(-1)[1], /每张图片不能超过/);
});

test('thread creation distinguishes business errors from navigation failures after success', async () => {
  for (const [code, navigationFails] of [[1, false], [0, false], [0, true]]) {
    const { guard } = setupGuard();
    const postingTitle = ref('测试标题'), postingContent = ref('**正文**'), prompt = promptSpy();
    const config = { indexNeedRefresh: false }, routes = [];
    const { submitPosting } = bindings('src/pages/posting/posting.vue', ['submitPosting'], {
      submitting: ref(false), account: { is_login: true, user_info: { id: 7 } }, selectedForum: ref({ id: 2 }),
      selectedThemeType: ref({ id: 3 }), postingTitle, postingContent, imgFileList: ref([]),
      submissionGuard: guard, submissionFingerprint, THREAD_MAX_LENGTH, requestErrorMessage, prompt, config,
      postCaptcha: { tryVerify: callback => callback('test') }, createMessage: text => text,
      PostingThread: async () => ({ data: { code, msg: '发布被拒绝', data: { id: 99 } } }),
      Taro: { navigateTo: async options => { routes.push(options.url); if (navigationFails) throw new Error('navigation failed'); } },
    });
    await submitPosting();
    assert.equal(routes.length, code === 0 ? 1 : 0);
    assert.equal(postingContent.value, code === 0 ? '' : '**正文**');
    assert.equal(config.indexNeedRefresh, code === 0);
    assert.equal(guard.remainingSeconds(7), code === 0 ? 10 : 0);
    assert.equal(prompt.messages.at(-1)[0], code === 0 ? (navigationFails ? 'text' : 'success') : 'fail');
  }
});
