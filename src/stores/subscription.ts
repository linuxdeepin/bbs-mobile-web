import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import Taro from '@tarojs/taro';
import { usePromptStore } from '@/stores';
import { MessageSubscriptionList, MessageSubscription, MessageUnSubscription, MessageSubscriptionListResponse } from '@/api';

export const useSubscriptionStore = defineStore('subscription', () => {
  // 模板id
  const templIds = ['39N73zpCZ5KZ3SF0NBvDi661mA5yt74X6XAqrsrOZVc'];
  // 服务器订阅状态
  const serverSubscribed = reactive<MessageSubscriptionListResponse>({
    Status: "reject",
    MessageSent: true,
    TemplateID: "39N73zpCZ5KZ3SF0NBvDi661mA5yt74X6XAqrsrOZVc"
  });
  // 小程序设置信息
  const settings = ref<Taro.getSetting.SuccessCallbackResult>();
  const prompt = usePromptStore();
  const isH5 = process.env.TARO_ENV === 'h5';
  // 订阅没有勾选“总是保持以上选择，不再询问”时的弹窗
  const subscribeDialogVisible = ref(false);
  // 自动订阅成功通知
  const autoSubscribeNotify = reactive({
    visible: false,
    text: "自动订阅成功",
    type: "primary"
  });
  // 登录界面消息订阅弹窗
  const loginSubscribeDialogVisible = ref(false);

  const isSubscribe = computed(() => {
    const state = settings.value?.subscriptionsSetting?.itemSettings?.[templIds[0]];
    return settings.value?.subscriptionsSetting?.mainSwitch !== false &&
      state !== 'reject' && state !== 'ban' &&
      serverSubscribed.Status === 'accept' && !serverSubscribed.MessageSent;
  })

  // 用户主动订阅
  const subscribeMessage = async () => {
    if (isH5) {
      return;
    }

    try {
      if (!settings.value) await getSetting();
      if (!settings.value?.subscriptionsSetting?.mainSwitch) {
        prompt.showToast("fail", "请在设置中打开消息通知");
        return;
      }
      const result = await Taro.requestSubscribeMessage({
        tmplIds: templIds,
        entityIds: templIds,
      });
      await getSetting();
      const accepted = templIds.filter(id => result[id] === 'accept');
      if (!accepted.length) {
        prompt.showToast("text", "未开启消息订阅");
        return;
      }
      if (!settings.value?.subscriptionsSetting?.itemSettings?.[templIds[0]]) {
        subscribeDialogVisible.value = true;
      }
      await MessageSubscription(accepted);
      await getSeverSubscribe();
      Taro.setStorageSync("firstSubscribe", true);
      prompt.showToast("success", "订阅成功");
    } catch (error) {
      prompt.showToast("fail", "订阅失败,请稍后再试");
      return;
    }
  };

  // 用户取消订阅
  const cancelSubscribe = async () => {
    try {
      await MessageUnSubscription(templIds);
      serverSubscribed.Status = "reject";
      serverSubscribed.MessageSent = true;
      prompt.showToast("success", "取消订阅成功");
      void getSeverSubscribe().catch(console.warn);
    } catch {
      prompt.showToast("fail", "取消订阅失败，请稍后重试");
    }
  };

  // 获取系统设置
  const getSetting = async () => {
    if (isH5) return;
    const res = await Taro.getSetting({ withSubscriptions: true })
    settings.value = res;
  }

  // 自动续订
  const autoRenew = async () => {
    if (isH5) {
      return;
    }

    const subscription = settings.value?.subscriptionsSetting
    if (!subscription) {
      return;
    }
    // 检查消息开关是否打开
    if (!subscription.mainSwitch) {
      return;
    }

    if (!subscription.itemSettings || subscription.itemSettings[templIds[0]] !== 'accept') {
      return;
    }

    // 检查用户是否主动取消订阅
    if (serverSubscribed.Status == "reject") {
      return;
    }

    // 检查是否已经订阅
    if (serverSubscribed.Status == "accept" && !serverSubscribed.MessageSent) {
      return;
    }

    // 自动订阅
    try {
      const result = await Taro.requestSubscribeMessage({
        tmplIds: templIds,
        entityIds: templIds
      });
      const accepted = templIds.filter(id => result[id] === 'accept');
      if (!accepted.length) return;
      await MessageSubscription(accepted);
      await getSeverSubscribe();
      autoSubscribeNotify.visible = isSubscribe.value;
    } catch (error) {
      prompt.showToast("fail", "自动订阅失败，请稍后重试");
    }
  }

  // 获取服务器订阅状态
  const getSeverSubscribe = async () => {
    if (isH5) {
      return;
    }
    const res = await MessageSubscriptionList();
    if (res.data.length <= 0) {
      serverSubscribed.Status = "reject";
      serverSubscribed.MessageSent = true;
      return;
    }
    serverSubscribed.Status = res.data[0].Status;
    serverSubscribed.MessageSent = res.data[0].MessageSent;
    serverSubscribed.TemplateID = res.data[0].TemplateID;
  }

  return {
    loginSubscribeDialogVisible,
    subscribeDialogVisible,
    autoSubscribeNotify,
    isSubscribe,
    serverSubscribed,
    subscribeMessage,
    cancelSubscribe,
    getSetting,
    autoRenew,
    getSeverSubscribe
  };
});
