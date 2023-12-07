import { useAsyncState } from "@vueuse/core";
import { defineStore } from "pinia";
import { CarouselConfig, WeixinShareConfig } from "@/api";

export const useConfigStore = defineStore("config", () => {
  const carouselState = useAsyncState(() => CarouselConfig(), null);
  const weixinShare = useAsyncState(() => WeixinShareConfig(), null);
  return { carouselState, weixinShare };
});
