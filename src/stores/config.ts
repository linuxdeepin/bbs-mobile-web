import { useAsyncState } from "@vueuse/core";
import { defineStore } from "pinia";
import { CarouselConfig, WeixinShareConfig } from "@/api";
import { ref } from "vue";
import Taro from "@tarojs/taro";

export const useConfigStore = defineStore("config", () => {
  const carouselState = useAsyncState(() => CarouselConfig(), null);
  const weixinShare = useAsyncState(() => WeixinShareConfig(), null);
  const indexNeedRefresh = ref(false);
  const theme = ref(Taro.getStorageSync("theme") || "light");
  const setTheme = (_theme: string) => {
    Taro.setStorage({ key: "theme", data: _theme });
    theme.value = _theme;
  }
  return { carouselState, weixinShare, indexNeedRefresh, theme, setTheme };
});
