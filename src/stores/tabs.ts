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
  return { active, change };
});
