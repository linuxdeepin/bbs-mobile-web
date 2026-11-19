const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { ref, reactive, nextTick, effectScope } = require('vue');
const { computedAsync, until } = require('@vueuse/core');
const { createPinia, setActivePinia } = require('pinia');
const { root, bindings, loadTS, find, evaluate, promptSpy, deferred } = require('./helpers.cjs');
const flush = async () => { await Promise.resolve(); await nextTick(); await Promise.resolve(); await nextTick(); };

function accountStore(login = async () => ({ code: 'test' })) {
  setActivePinia(createPinia());
  const routes = [];
  const Taro = {
    login, switchTab: async options => routes.push(['tab', options.url]),
    navigateTo: async options => routes.push(['page', options.url]),
    getStorageSync() {}, setStorageSync() {},
  };
  const api = { GetAccountInfo: async () => ({ id: 7 }), LoginByCode: async () => {} };
  const { useAccountStore } = loadTS('src/stores/account.ts', {
    '@tarojs/taro': Taro, '@/api': api, '../assets/captcha': () => {},
    './subscription': { useSubscriptionStore: () => ({ getSeverSubscribe: async () => {} }) },
  }, { TARO_ENV: 'weapp' });
  return { store: useAccountStore(), routes };
}

test('registration uses a normal page route; cached account tab consumes password/choose state without URL parameters', async () => {
  const { store, routes } = accountStore();
  await store.gotoRegister();
  await store.gotoPasswordLogin('13800000000');
  assert.deepEqual(routes, [['page', '/pages/register/register'], ['tab', '/pages/account/account']]);
  const loginAction = ref({ show: false });
  const loginByPassword = ref({ show: false, username: '', password: 'old', usernameReadonly: false });
  const show = find('src/pages/account/account.vue', node => ts.isCallExpression(node) && node.expression.getText() === 'useDidShow');
  const onShow = evaluate(`(${show.arguments[0].getText()})`, {
    account: store, setMessageCount() {}, isH5: false, loginAction, loginByPassword,
  });
  onShow();
  assert.equal(store.loginRequest, null);
  assert.equal(loginByPassword.value.username, '13800000000');
  assert.equal(loginByPassword.value.usernameReadonly, true);
  assert.equal(loginByPassword.value.show, true);
  await store.gotoLogin();
  onShow();
  assert.equal(loginAction.value.show, true);
  assert.equal(loginByPassword.value.show, false);
  assert.equal(store.loginRequest, null);
});

test('WeChat login failure/empty code rejects instead of leaving the caller pending', async () => {
  const failed = accountStore(async () => { throw new Error('微信不可用'); });
  await assert.rejects(failed.store.login(), /微信不可用/);
  const empty = accountStore(async () => ({ code: '' }));
  await assert.rejects(empty.store.login(), /微信登录失败/);
});

test('a cold-start composer waits for account loading before deciding to redirect', async () => {
  let redirects = 0, badgeLoads = 0;
  const account = reactive({ loaded: false, is_login: false, gotoLogin() { redirects++; } });
  const hook = find('src/pages/posting/posting.vue', node => ts.isCallExpression(node) && node.expression.getText() === 'useLoad');
  const onLoad = evaluate(`(${hook.arguments[0].getText()})`, {
    account, until, setMessageCount() { badgeLoads++; },
  });
  const loading = onLoad();
  await flush();
  assert.equal(redirects, 0);
  account.is_login = true;
  account.loaded = true;
  await loading;
  assert.equal(redirects, 0);
  assert.equal(badgeLoads, 1);
});

test('late page response cannot replace the latest page or clear its loading state', async () => {
  const requests = [], pagination = ref({ page: 1, limit: 10 }), loading = ref(false);
  const scope = effectScope();
  const { threadPosts } = scope.run(() => bindings('src/pages/thread/thread.vue', ['threadPosts'], {
    computedAsync, postRefresh: ref(0), threadID: ref(1), pagination, postLoading: loading,
    ThreadPostList: (_id, options) => { const d = deferred(); requests.push({ ...d, ...options }); return d.promise; },
  }));
  await flush(); pagination.value.page = 2; await flush();
  requests[0].resolve({ data: { page: 1 } }); await flush();
  assert.equal(threadPosts.value, undefined);
  assert.equal(loading.value, true);
  requests[1].resolve({ data: { page: 2 } }); await flush();
  assert.equal(threadPosts.value.page, 2);
  assert.equal(loading.value, false);
  scope.stop();
});

test('thread move errors retain selection and return false; only business success closes the dialog', async () => {
  for (const mode of ['network', 'business', 'success']) {
    const prompt = promptSpy();
    const selectedForum = ref({ id: 1, name: 'forum' }), selectedThemeType = ref({ id: 2, name: 'theme' });
    const { moderatorMoveDialogClosed } = bindings('src/pages/thread/thread-op.vue', ['moderatorMoveDialogClosed'], {
      selectedForum, selectedThemeType, threadInfo: ref({ id: 3 }), prompt, emit() {},
      ModeratorMoveThread: async () => {
        if (mode === 'network') throw new Error('network');
        return { data: { code: mode === 'success' ? 0 : 1 } };
      },
    });
    assert.equal(await moderatorMoveDialogClosed('ok'), mode === 'success');
    assert.equal(selectedForum.value.id, mode === 'success' ? 0 : 1);
    assert.equal(prompt.messages.at(-1)[0], mode === 'success' ? 'success' : 'warn');
  }
});

test('subscriptions post only accepted templates; rejection and API errors never report success', async () => {
  for (const result of ['accept', 'reject', 'error']) {
    const prompt = promptSpy(), subscriptions = [];
    const { subscribeMessage } = bindings('src/stores/subscription.ts', ['subscribeMessage'], {
      isH5: false, settings: ref({ subscriptionsSetting: { mainSwitch: true, itemSettings: {} } }), prompt,
      templIds: ['template'], Taro: {
        requestSubscribeMessage: async () => { if (result === 'error') throw new Error('error'); return { template: result }; },
        setStorageSync() {},
      },
      getSetting: async () => {}, subscribeDialogVisible: ref(false),
      MessageSubscription: async ids => subscriptions.push(ids), getSeverSubscribe: async () => {},
    });
    await subscribeMessage();
    assert.equal(subscriptions.length, result === 'accept' ? 1 : 0);
    assert.equal(prompt.messages.at(-1)[0] === 'success', result === 'accept');
  }
});

test('registration network errors are handled even without an HTTP response object', async () => {
  for (const method of ['registerCode', 'register']) {
    const prompt = promptSpy();
    const api = { registerCode: async () => { throw new Error('network'); }, register: async () => { throw new Error('network'); } };
    const methods = bindings('src/pages/register/register.vue', [method], {
      account: api, prompt, captcha: { captchaID: 'test' }, phone: ref('13800000000'), phoneCode: ref('123456'),
      phoneExists: ref(false), codeSent: ref(false),
    });
    await assert.doesNotReject(methods[method]('test'));
    assert.equal(prompt.messages.at(-1)[0], 'fail');
  }
});

test('unsubscribe handles request failures and keeps confirmed cancellation when refresh fails', async () => {
  for (const result of ['success', 'cancel-error', 'refresh-error']) {
    const prompt = promptSpy();
    const serverSubscribed = { Status: 'accept', MessageSent: false };
    const { cancelSubscribe } = bindings('src/stores/subscription.ts', ['cancelSubscribe'], {
      templIds: ['template'], serverSubscribed, prompt, console: { warn() {} },
      MessageUnSubscription: async () => { if (result === 'cancel-error') throw new Error('offline'); },
      getSeverSubscribe: async () => { if (result === 'refresh-error') throw new Error('offline'); },
    });
    await cancelSubscribe();
    await flush();
    assert.equal(serverSubscribed.Status, result === 'cancel-error' ? 'accept' : 'reject');
    assert.equal(prompt.messages.at(-1)[0], result === 'cancel-error' ? 'fail' : 'success');
  }
});

test('winnow success emits the event handled by the parent reply list', async () => {
  const events = [];
  const { moderatorWinnowDialogClosed } = bindings('src/pages/thread/post-op.vue', ['moderatorWinnowDialogClosed'], {
    threadInfo: ref({ forum_id: 1 }), winnowFormRef: ref({ validate: async () => ({ valid: true }) }),
    post: ref({ id: 2, post_user_id: 3 }), winnowForm: ref({ reason: 'test', notify: true }), postIsWinnow: ref(false),
    WinnowThreadPostByModerator: async () => ({ data: { code: 0 } }), prompt: promptSpy(),
    emit: event => events.push(event), Taro: { pageScrollTo() {} },
  });
  await moderatorWinnowDialogClosed('ok');
  const parent = fs.readFileSync(path.join(root, 'src/pages/thread/thread.vue'), 'utf8');
  assert.ok(events.includes('winnowPostsRefresh'));
  assert.match(parent, /@winnowPostsRefresh="winnowPostsRefresh\+\+"/);
});
