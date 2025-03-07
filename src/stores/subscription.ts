import { defineStore } from 'pinia';
import { ref } from 'vue';
import Taro from '@tarojs/taro';
import { usePromptStore } from '@/stores';

export const useSubscriptionStore = defineStore('subscription', () => {
  // 状态
  const temIds = ['39N73zpCZ5KZ3SF0NBvDi661mA5yt74X6XAqrsrOZVc'];
  const subscribeDialogVisible = ref(false);
  const isSubscribed = ref(false);
  const isClosed = ref(false);
  const settings = ref<Taro.getSetting.SuccessCallbackResult>();
  const prompt = usePromptStore();
  const isH5 = process.env.TARO_ENV === 'h5';

  // 获取订阅设置并保存到 settings 变量
  const getSubscriptionSettings = async () => {
    const res = await Taro.getSetting({ withSubscriptions: true });
    settings.value = res;
    console.log("getSetting: ", res);
    return res;
  };
  // 检查模板通知订阅状态，reject -> 关闭，accept -> 订阅
  const checkSubscriptionStatus = (itemSettings) => {
    if (!itemSettings) return false;
    if (itemSettings[temIds[0]] === 'reject') {
      isClosed.value = true;
      return false;
    }
    isSubscribed.value = true;
    return true;
  };

  // 点击消息Tab时的逻辑
  const checkSubscriptionOnTabTap = async () => {
    if (isH5) return;

    const startTime = new Date().getTime();

    if (!settings.value) {
      await getSubscriptionSettings();
    }
    // 检查用户是否关闭了消息通知主开关
    if (!settings.value?.subscriptionsSetting.mainSwitch) {
      isClosed.value = true;
      return;
    }
    // 检查用户是否勾选了“总是保持以上选择，不再询问”
    const itemSettings = settings.value.subscriptionsSetting.itemSettings;
    if (checkSubscriptionStatus(itemSettings)) {
      console.log("自动订阅：", new Date().getTime() - startTime);
      Taro.requestSubscribeMessage({
        tmplIds: temIds,
        entityIds: temIds,
        success: (res) => {
          console.log("requestSubscribeMessage", res);
        },
      });
    } else {
      isSubscribed.value = false;
    }
  };

  // 用户主动订阅
  const subscribeMessage = async () => {
    if (isSubscribed.value) {
      cancelSubscribe();
      return;
    }

    if (isClosed.value) {
      prompt.showToast("fail", "请在设置中打开消息通知");
      return;
    }
    const res = await Taro.requestSubscribeMessage({
      tmplIds: temIds,
      entityIds: temIds,
    });

    console.log("订阅成功", res);
    await getSubscriptionSettings();
    console.log("getSetting ", settings.value);

    if (!settings.value?.subscriptionsSetting.itemSettings) {
      subscribeDialogVisible.value = true;
      return;
    }
    if (settings.value?.subscriptionsSetting.itemSettings) {
      isSubscribed.value = true;
    }
  };

  // 用户取消订阅
  const cancelSubscribe = () => {
    console.log("cancelSubscribe");
  };

  return {
    subscribeDialogVisible,
    isSubscribed,
    isClosed,
    getSubscriptionSettings,
    checkSubscriptionOnTabTap,
    subscribeMessage,
    cancelSubscribe,
  };
});