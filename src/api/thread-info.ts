import { http, apiServer } from "./http";

export async function ThreadInfo(id: number) {
  return http.get<ThreadInfoResponse>("/api/v1/thread/info", {
    params: { id },
  });
}

export async function ThreadPoll(tid: number, polloptionid: number[]) {
  return http.post("/api/v1/thread/poll", { tid, polloptionid });
}

export async function ThreadUP(id: number, idType: string) {
  const params = {
    id: id,
    idtype: idType,
  }
  return http.post<{ code: number, msg: string }>("/api/v1/thread/up", params);
}

export async function ThreadFavorite(id: number) {
  return http.post<{ code: number, msg: string }>("/api/v1/thread/favorite", { id });
}

export async function DeleteThread(id: number) {
  return http.request<{ code: number, msg: string }>({
    url: apiServer + "/api/v1/thread",
    method: "delete",
    data: { id },
    params: { id },
  })
}

// 获取帖子所属版块的版主
export async function ThreadUserList(forum_id: number) {
  return http.get<ThreadUserListResponse>("/api/v1/thread/user/list", { params: { forum_id } });
}

// 版主删除帖子
export async function ModeratorDeleteThread(msg: { id: number, forum_id: number, o_user_id: number, note: string, is_notify: number }) {
  return http.put<{ code: number, msg: string }>("/api/v1/thread/delete", { msg: [msg] });
}

// 版主移动帖子
export async function ModeratorMoveThread(id: number, forum_id: number, theme_id: number) {
  return http.post<{ code: number, msg: string }>("/api/v2/user/threads/move", { ids: [id], forum_id, theme_id });
}

// 标记帖子为已解决
export async function ThreadResolved(id: number) {
  return http.post<{ code: number, msg: string }>(`/api/v2/user/thread/${id}/resolve`);
}

// 标记帖子为未解决
export async function ThreadUnResolved(id: number) {
  return http.post<{ code: number, msg: string }>(`/api/v2/user/thread/${id}/unresolve`);
}

// 关闭和打开帖子
export async function ThreadClosed(opt: {
  is_closed: number,
  is_notify: number,
  note: string,
  o_user_id: number,
  thread_id: number
}) {
  return http.post<{ code: number, msg: string }>("/api/v1/thread/close", { ...opt });
}

interface ThreadInfoResponse {
  code: number;
  data: ThreadInfoData;
  msg: string;
}

export interface ThreadInfoData {
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
  is_digest_forum: number;
  is_top_forum: number;
  hot_value: number;
  is_favorite: boolean;
  is_up: boolean;
  like_cnt: number;
  type: Type;
  user: User;
  post: Post;
  last_date_desc: string;
  created_at_desc: string;
  updated_at_desc: string;
  deleted_at?: any;
  forum: Forum;
  poll_list: Polllist;
  is_poll: number;
  attrs: any[];
}

interface Polllist {
  tid: number;
  overt: number;
  multiple: number;
  visible: number;
  poll_day: number;
  expiration: string;
  pollpreview: string;
  voters: number;
  voters_number: number;
  maxchoices: number;
  forum_polloption?: any;
  polloptionids?: any;
  poll_expire: boolean;
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
  type: Type2;
  link_url: string;
}

interface Type2 {
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

interface Post {
  id: number;
  thread_id: number;
  post_user_id: number;
  isfirst: number;
  userip: string;
  images_num: number;
  files_num: number;
  doctype: number;
  quote_post_id: number;
  quote_user_id: number;
  message: string;
  message_fmt: string;
  checked: number;
  like_cnt: number;
  has_read: number;
  created_at: string;
  updated_at: string;
  post_comment: any[];
  user: User;
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

interface ThreadUserListResponse {
  code: number;
  data: ThreadUserListData[];
  msg: string;
}

interface ThreadUserListData {
  id: number;
  group_type: number;
  username: string;
  nickname: string;
  avatar: string;
}