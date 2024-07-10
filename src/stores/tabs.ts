import { defineStore } from "pinia";
import { ref } from "vue";
import Taro from "@tarojs/taro";

export const useTabsStore = defineStore("tabs", () => {
  const active = ref("index" as "index" | "account" | "message");
  // 消息tab的未读数
  const messageCount = ref(0);
  const change = (item: { name: typeof active.value }) => {
    active.value = item.name;
    const route = `/pages/${item.name}/${item.name}`;

    const routes = Taro.getCurrentPages().map((page) => {
      // 在h5环境 route有/前缀，在微信小程序中，没有/前缀，所以需要补充
      if (page.route && !page.route.startsWith("/")) {
        return "/" + page.route;
      }
      return page.route || "";
    });

    const first = routes[0];
    const current = routes[routes.length - 1];
    // 导航到当前面
    if (current === route) {
      return;
    }
    // 导航到首页，使用back，界面动画逻辑更优
    // 并且可以避免页面堆叠超出限制
    if (first === route) {
      Taro.navigateBack({ delta: 9999 });
      return;
    }
    Taro.navigateTo({
      url: route,
    });
  };
  return { active, messageCount, change };
});
