import { http } from "./http";

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

interface PostListResponse {
  code: number;
  data: Post[];
  msg: string;
  total_count: number;
  total_limit: number;
  total_offset: number;
}

interface Post {
  id: number;
  thread_id: number;
  forum_id: number;
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
  is_login: number;
  is_up: boolean;
  is_top_forum: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  user: User;
  quote_user: User;
  quote_post: Quotepost;
  thread: Thread;
  son_post: Quotepost;
  post_comment: any[];
  group_forum: Groupforum;
  total: number;
  storey: number;
}

interface Quotepost {
  id: number;
  thread_id: number;
  forum_id: number;
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
  deleted_at?: any;
  user: User;
  quote_user: User;
  thread: Thread;
  group_forum: Groupforum;
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

interface Thread {
  id: number;
  forum_id: number;
  user_id: number;
  userip: string;
  subject: string;
  last_date: string;
  views_cnt: number;
  posts_cnt: number;
  image_num: number;
  files_num: number;
  mods_cnt: number;
  isclosed: number;
  first_post_id: number;
  last_user_id: number;
  last_nickname: string;
  last_post_id: number;
  created_at: string;
  updated_at: string;
  favourite_cnt: number;
  checked: number;
  state: number;
  like_cnt: number;
  is_poll: number;
  type_id: number;
  hot_value: number;
  last_date_desc: string;
  created_at_desc: string;
  updated_at_desc: string;
  top: number;
  deleted_at?: any;
  Language: string;
}

interface User {
  id: number;
  account_id: number;
  group_id: number;
  openid: string;
  union_id: string;
  group_name: string;
  username: string;
  realname: string;
  nickname: string;
  threads_cnt: number;
  posts_cnt: number;
  msg_cnt: number;
  credits_num: number;
  created_at: string;
  updated_at: string;
  desc: string;
  login_date: string;
  logins_cnt: number;
  avatar: string;
  digests_num: number;
  state: number;
  favourite_cnt: number;
  like_cnt: number;
  level: number;
  levels: Levels;
}

interface Levels {
  id: number;
  level_name: string;
  color_id: number;
  level_icon: string;
  admin: string;
  min: number;
  max: number;
  created_at: string;
  updated_at: string;
  deleted_at?: any;
}
