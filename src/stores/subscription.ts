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
    return settings.value?.subscriptionsSetting.itemSettings &&
      settings.value?.subscriptionsSetting.itemSettings[templIds[0]] === 'accept' &&
      serverSubscribed.Status === 'accept' && !serverSubscribed.MessageSent;
  })

  // 用户主动订阅
  const subscribeMessage = async () => {
    if (isH5) {
      return;
    }

    if (!settings.value?.subscriptionsSetting.mainSwitch) {
      prompt.showToast("fail", "请在设置中打开消息通知");
      return;
    }
    try {
      await Taro.requestSubscribeMessage({
        tmplIds: templIds,
        entityIds: templIds,
      });
    } catch (error) {
      prompt.showToast("fail", "订阅失败,请稍后再试");
      return;
    }
    console.log("wx requestSubscribeMessage success");

    await getSetting();

    if (!settings.value?.subscriptionsSetting.itemSettings) {
      subscribeDialogVisible.value = true;
    }

    // 服务器订阅
    await MessageSubscription(templIds);
    console.log("server MessageSubscription success");
    getSeverSubscribe();
    Taro.setStorageSync("firstSubscribe", true);
    prompt.showToast("success", "订阅成功");
  };

  // 用户取消订阅
  const cancelSubscribe = async () => {
    await MessageUnSubscription(templIds);
    getSeverSubscribe();
    prompt.showToast("success", "取消订阅成功");
  };

  // 获取系统设置
  const getSetting = async () => {
    const res = await Taro.getSetting({ withSubscriptions: true })
    settings.value = res;
    console.log("系统设置", res);
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
    await Taro.requestSubscribeMessage({
      tmplIds: templIds,
      entityIds: templIds
    });

    await MessageSubscription(templIds);

    const result = await MessageSubscriptionList();
    if (result.data.length <= 0) {
      return;
    }
    autoSubscribeNotify.visible = true;
    getSeverSubscribe();
    console.log("autoRenew success");
  }

  // 获取服务器订阅状态
  const getSeverSubscribe = async () => {
    if (isH5) {
      return;
    }
    const res = await MessageSubscriptionList();
    if (res.data.length <= 0) {
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