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
