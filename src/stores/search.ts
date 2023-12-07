import { defineStore } from "pinia";
import { ref } from "vue";

import Taro from "@tarojs/taro";

export const useSearchStore = defineStore("search", () => {
  const history = ref(Taro.getStorageSync<string[]>("search/history") || []);
  const addHistory = (keyword: string) => {
    history.value.unshift(keyword);
    history.value = [...new Set(history.value).values()];
    Taro.setStorageSync("search/history", history.value);
  };
  const cleanHistory = () => {
    history.value = [];
    Taro.removeStorageSync("search/history");
  };
  return {
    history,
    addHistory,
    cleanHistory,
  };
});
