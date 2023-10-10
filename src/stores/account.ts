import { defineStore } from "pinia";
import { ref } from "vue";

import { http } from "./http";

export const useAccountStore = defineStore("account", () => {
  const is_login = ref(false);
  const user_info = ref({
    nickname: "",
    avatar: "",
    username: "",
    desc: "",
    threads_cnt: 0,
    posts_cnt: 0,
    favourite_cnt: 0,
  });
  getAccountInfo().then((info) => {
    is_login.value = true;
    user_info.value = {
      nickname: info.nickname,
      avatar: info.avatar,
      username: info.username,
      desc: info.desc,
      threads_cnt: info.threads_cnt,
      posts_cnt: info.posts_cnt,
      favourite_cnt: info.favourite_cnt,
    };
    console.log({ is_login, user_info });
  });
  return { is_login, user_info };
});

async function getAccountInfo() {
  return http
    .get<AccountInfo>("/api/v1/login/is_login")
    .then((resp) => resp.data);
}

interface AccountInfo {
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
