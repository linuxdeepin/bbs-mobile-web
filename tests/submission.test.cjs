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
