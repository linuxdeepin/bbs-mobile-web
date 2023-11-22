import { defineStore } from "pinia";
import { ref } from "vue";

import { http } from "./http";
import Taro from "@tarojs/taro";

export const useSearchStore = defineStore("search", () => {
  const count = ref(0);
  const loaded = ref(false);
  const data = ref([] as SearchResult[]);
  const history = ref([] as string[]);
  const getPageData = (keyword: string, offset: number, limit: number) => {
    loaded.value = false;
    http
      .get<SearchResult[]>("/api/v2/public/search/thread", {
        params: { filter_order: "updated_at", offset, limit, keyword },
      })
      .then((resp) => {
        loaded.value = true;
        data.value = resp.data;
        count.value = Number(resp.headers["x-total-count"] || 0);
      });
  };
  const init = () => {
    loaded.value = false;
    count.value = 0;
    data.value = [];
    history.value = Taro.getStorageSync<string[]>("search/history") || [];
  };
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
    loaded,
    count,
    data,
    history,
    init,
    addHistory,
    cleanHistory,
    getPageData,
  };
});

interface SearchResult {
  id: number;
  subject: string;
  content: string;
  forum_id: number;
  type_id: number;
  top: number;
  top_sort: number;
  hot_value: number;
  last_date: string;
  is_digest: number;
  created_at: string;
  updated_at: string;
  language: string;
  attrs: any[];
  index_version: string;
}
