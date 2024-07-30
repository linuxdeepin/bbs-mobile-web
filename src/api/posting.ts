import { http } from "./http";

export async function GetForum() {
  return http.get<ForumResponse[]>("/api/v1/forum");
}

export async function GetTheme(params: { forum_id: number }) {
  return http.get<ThemeResponse[]>("/api/v1/forum/theme", { params });
}

export async function PostingThread(opt: {
  forum_id: number,
  message: string,
  subject: string,
  type_id: number,
  user_id: number,
  captcha_id: string,
}) {
  let params = {
    forum_id: opt.forum_id,
    message: opt.message,
    subject: opt.subject,
    type_id: opt.type_id,
    user_id: opt.user_id,
    validate: opt.captcha_id,
    language: "zh_CN",
    captcha_id: "f2c00d8c7cb64136a231e7f95f9c5e1a"
  }
  return http.post<PostingThreadResponse>('/api/v1/thread?captcha_id=f2c00d8c7cb64136a231e7f95f9c5e1a', params);
}

export interface ForumResponse {
  id: number;
  type: number;
  name: string;
  name_en: string;
  rank: number;
  created_at: string;
  updated_at: string;
  forum: Forum[];
}

interface Forum {
  id: number;
  name: string;
  name_en: string;
  rank: number;
  threads_cnt: number;
  posts_cnt: number;
  visit_cnt: number;
  favourite_cnt: number;
  today_posts_cnt: number;
  today_threads_cnt: number;
  today_visit_cnt: number;
  brief: string;
  brief_en: string;
  announcement: string;
  accesson: string;
  orderby: number;
  owner_uids: string;
  digests_cnt: number;
  icon: string;
  created_at: string;
  updated_at: string;
  type_id: number;
  is_recommend: number;
  type: ForumType;
  link_url: string;
}

interface ForumType {
  id: number;
  type: number;
  name: string;
  name_en: string;
  rank: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  is_tj: number;
}

export interface ThemeResponse {
  id: number;
  forum_id: number;
  name: string;
  name_en: string;
  rank: number;
  template: string;
  template_en: string;
}

interface PostingThreadResponse {
  code: number;
  data: PostingThreadData;
  msg: string;
}

interface PostingThreadData {
  id: number;
  forum_id: number;
  top: number;
  user_id: number;
  userip: string;
  subject: string;
  last_date: string;
  views_cnt: number;
  posts_cnt: number;
  images_num: number;
  files_num: number;
  mods_cnt: number;
  isclosed: number;
  first_post_id: number;
  last_user_id: number;
  last_username: string;
  last_post_id: number;
  created_at: string;
  updated_at: string;
  favourite_cnt: number;
  checked: number;
  state: number;
  type_id: number;
  is_digest: number;
  hot_value: number;
  is_favorite: boolean;
  is_up: boolean;
  like_cnt: number;
  last_date_desc: string;
  created_at_desc: string;
  updated_at_desc: string;
}