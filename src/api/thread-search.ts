import { http } from "./http";

// 搜索帖子
export async function SearchThread(
  keyword: string,
  page: number,
  pageSize: number
) {
  return http.get<SearchResult[]>("/api/v2/public/search/thread", {
    params: {
      filter_order: "updated_at",
      offset: (page - 1) * pageSize,
      limit: pageSize,
      keyword,
    },
  });
}

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
