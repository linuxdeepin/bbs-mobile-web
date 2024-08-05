import { useAsyncState } from "@vueuse/core";
import { defineStore } from "pinia";
import { CarouselConfig, WeixinShareConfig } from "@/api";
import { ref } from "vue";

export const useConfigStore = defineStore("config", () => {
  const carouselState = useAsyncState(() => CarouselConfig(), null);
  const weixinShare = useAsyncState(() => WeixinShareConfig(), null);
  const indexNeedRefresh = ref(false);
  return { carouselState, weixinShare, indexNeedRefresh };
});
