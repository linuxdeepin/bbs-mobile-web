import { defineStore } from "pinia";
import { ref } from "vue";
import Taro from "@tarojs/taro";

export const useTabsStore = defineStore("tabs", () => {
  const active = ref("index" as "index" | "account");
  const change = (item: { name: typeof active.value }) => {
    active.value = item.name;
    const route = `pages/${item.name}/${item.name}`;
    const pages = Taro.getCurrentPages();
    const first = pages[0].route;
    const current = pages[pages.length - 1].route;
    if (current === route) {
      return;
    }
    if (first === route) {
      Taro.navigateBack({ delta: 9999 });
      return;
    }
    Taro.navigateTo({
      url: "/" + route,
    });
  };
  // 单个页面tab状态，
  // 在用户点击tab跳转页面时会更改active，但使用返回功能回退页面不会触发组件渲染
  // 这会导致返回上一页后，active状态不恢复到当前页
  // 所以需要为每个页面单独创建active，然后在跳转后使用 nextTick 将页面的active恢复为自身
  const usePageTabs = (name: typeof active.value) => {
    const tabActive = ref(name);
    const tabChange = (item: { name: typeof active.value }) => {
      change(item);
      // 在导航后恢复active
      Taro.nextTick(() => {
        tabActive.value = name;
      });
    };
    return { tabActive, tabChange };
  };
  return { active, change, usePageTabs };
});
