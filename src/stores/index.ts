import { defineStore } from "pinia";
import { ref } from "vue";

import { apiServer, http } from "./http";

// 共享store
export { useThreadStore } from "./thread";
export { useSearchStore } from "./search";
export { useTabsStore } from "./tabs";
export { useAccountStore } from "./account";
export { useAgreementStore } from "./agreement";
export { usePromptStore } from "./prompt";

export const useIndexStore = defineStore("index", () => {
  const server = ref(apiServer);
  const page = ref(1);
  const loaded = ref(false);
  const threadLoaded = ref(false);
  const threads = ref([] as ThreadIndex[]);
  const threadCount = ref(0);
  const threadLimit = ref(20);
  const carousel = ref({ cards: [] } as CarouselConfig);
  const weixinShare = ref(null as WeixinShareConfig | null);
  async function weixinShareConfig() {
    getRawConfig<WeixinShareConfig>("weixin_share").then(
      (v) => (weixinShare.value = v)
    );
  }
  async function carouselConfig() {
    const config = await getRawConfig<CarouselConfig>("carousel");
    config.cards = config.cards.filter(
      (item) => item.device === "all" || item.device === "weapp"
    );
    carousel.value = config;
  }
  async function indexThread(offset = 0) {
    threadLoaded.value = false;
    const resp = await getIndexThread({ offset, limit: threadLimit.value });
    threads.value = resp.data.ThreadIndex;
    threadCount.value = resp.data.total_count;
    threadLoaded.value = true;
  }
  // 翻页
  async function pageChange(v: number) {
    page.value = v;
    indexThread(v - 1);
  }
  Promise.all([carouselConfig(), indexThread(), weixinShareConfig()]).then(
    () => (loaded.value = true)
  );

  return {
    page,
    loaded,
    threadLoaded,
    threadCount,
    threadLimit,
    threads,
    carousel,
    server,
    weixinShare,
    pageChange,
  };
});

async function getRawConfig<T>(field: "carousel" | "weixin_share") {
  return http
    .get<RawConfig>("/api/v2/public/config/" + field)
    .then((resp) => JSON.parse(resp.data.value) as T);
}

async function getIndexThread(opt: {
  order?: string;
  offset?: number;
  limit?: number;
  languages?: string;
}) {
  const params = {
    order: "updated_at",
    offset: 0,
    limit: 20,
    languages: "zh_CN",
    ...opt,
  };
  return http.get<ThreadIndexResponse>("/api/v1/thread/index", {
    params,
  });
}

interface RawConfig {
  id: number;
  field: string;
  value: string;
}

interface CarouselConfig {
  cards: Card[];
}

interface Card {
  link: string;
  title: string;
  language: string;
  device: "phone" | "pc" | "weapp" | "all";
  img: {
    url: string;
  };
}

interface WeixinShareConfig {
  debug: boolean;
  title_max_length: number;
  title_suffix: string;
  daemon: string;
  default_img: string;
}

interface ThreadIndexResponse {
  total_count: number;
  ThreadIndex: ThreadIndex[];
}

interface ThreadIndex {
  id: number;
  forum_id: number;
  top: number;
  user_id: number;
  userip: string;
  subject: string;
  message: string;
  message_fmt: string;
  last_date: string;
  views_cnt: number;
  posts_cnt: number;
  mods_cnt: number;
  isclosed: number;
  last_user_id: number;
  last_username: string;
  last_post_id: number;
  created_at: string;
  updated_at: string;
  favourite_cnt: number;
  state: number;
  type_id: number;
  type: Type;
  user: User;
  post?: any;
  forum: Forum;
  group_forum: Groupforum;
  is_digest: number;
  is_digest_forum: number;
  is_top_forum: number;
  hot_value: number;
  last_date_desc: string;
  created_at_desc: string;
  updated_at_desc: string;
  is_poll: number;
  files_num: number;
  images_num: number;
  attrs: Attr[];
}

interface Attr {
  name: string;
  value: string;
}

interface Groupforum {
  id: number;
  user_id: number;
  group_id: number;
  forum_id: number;
  orderby: number;
  group: Group;
}

interface Group {
  id: number;
  name: string;
  name_en: string;
  pid: number;
  allowread: number;
  allowthread: number;
  allowpost: number;
  allowattach: number;
  allowdown: number;
  allowtop: number;
  allowupdate: number;
  allowdelete: number;
  allowmove: number;
  allowbanuser: number;
  allowdeleteuser: number;
  allowview: number;
  created_at: string;
  updated_at: string;
}

interface Forum {
  id: number;
  name: string;
  rank: number;
  threads_cnt: number;
  posts_cnt: number;
  visit_cnt: number;
  today_posts_cnt: number;
  today_threads_cnt: number;
  today_visit_cnt: number;
  brief: string;
  announcement: string;
  orderby: number;
  owner_uids: string;
  digests_cnt: number;
  icon: string;
  created_at: string;
  updated_at: string;
  type_id: number;
  link_url: string;
}

interface User {
  id: number;
  account_id: number;
  group_id: number;
  group_name: string;
  email: string;
  email_checked: number;
  username: string;
  realname: string;
  nickname: string;
  mobile: string;
  qq: string;
  threads_cnt: number;
  posts_cnt: number;
  msg_cnt: number;
  credits_num: number;
  create_ip: string;
  created_at: string;
  updated_at: string;
  login_ip: string;
  login_date: string;
  logins_cnt: number;
  avatar: string;
  digests_num: number;
  state: number;
  like_cnt: number;
  favourite_cnt: number;
  allow_speak: boolean;
  desc: string;
  level: number;
  levels: Levels;
}

interface Levels {
  id: number;
  admin: string;
  color_id: number;
  level_icon: string;
  level_name: string;
  min: number;
  max: number;
  created_at: string;
  updated_at: string;
}

interface Type {
  id: number;
  type: number;
  name: string;
  rank: number;
  created_at: string;
  updated_at: string;
  is_tj: number;
}
