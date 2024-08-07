import { http } from "./http";

export async function GetMyThread(opt: { limit: number, offset: number }) {
  const params = {
    id: 10000,
    limit: opt.limit,
    offset: opt.offset,
  }
  return http.get<MyThreadResonse>("/api/v1/user/thread", { params });
}

export async function GetMyPost(opt: { limit: number, offset: number }) {
  const params = {
    id: 10000,
    limit: opt.limit,
    offset: opt.offset,
  }
  return http.get<MyPostResponse>("/api/v1/user/post", { params });
}

export async function GetMyFavorite(opt: { limit: number, offset: number }) {
  const params = {
    idtype: "tid",
    limit: opt.limit,
    offset: opt.offset,
  }
  return http.get<MyFavoriteResponse>("/api/v1/user/favorite", { params });
}

// 获取用户信息
export async function GetUserInfo(id: number) {
  return http.get<UserInfoResponse>("/api/v1/user/info", { params: { id } });
}

// 获取用户帖子
export async function GetUserThread(user_id: number, limit: number, offset: number) {
  return http.get<MyThreadResonse>("/api/v1/user/thread", { params: { user_id, limit, offset } });
}

// 获取用户回复
export async function GetUserPost(user_id: number, limit: number, offset: number) {
  return http.get<MyPostResponse>("/api/v1/user/post", { params: { user_id, limit, offset } });
}

// 禁言和取消禁言
export async function GetProhibitUser(opt: { action: number, begin_at: string, hide_thread: boolean, reason: string, user_id: number }) {
  return http.post("/api/v1/user/crime", { ...opt });
}

export interface MyThreadResonse {
  code: number;
  data: MyThreadDatum[];
  message: string;
  total_count: number;
  total_limit: number;
  total_offset: number;
  total_tp_count: number;
}

interface MyThreadDatum {
  id: number;
  forum_id: number;
  top: number;
  user_id: number;
  type_id: number;
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
  is_digest: number;
  hot_value: number;
  favourite_cnt: number;
  checked: number;
  state: number;
  user: MyPostUser;
  forum: MyPostForum;
  type?: MyThreadType;
  post?: MyThreadPost;
  created_at_desc: string;
  updated_at_desc: string;
  last_date_desc: string;
}

interface MyThreadPost {
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
  deleted_at: null;
  user: MyPostUser;
  quote_user: MyPostUser;
  quote_post: MyPostQuotepost;
  thread: MyPostThread;
  son_post: MyPostQuotepost;
  post_comment: null;
  group_forum: MyPostGroupforum;
  total: number;
  storey: number;
}


interface MyThreadType {
  id: number;
  forum_id: number;
  forum: MyPostForum;
  name: string;
  name_en: string;
  rank: number;
  status: number;
  created_at: string;
  updated_at: string;
  deleted_at: null;
  template: string;
  template_en: string;
}


export interface MyPostResponse {
  data: MyPostDatum[];
  posts_count: number;
  total_count: number;
  total_limit: number;
  total_offset: number;
  total_tp_count: number;
}

interface MyPostDatum {
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
  updated_at_desc: string;
  user: MyPostUser;
  quote_user: MyPostUser;
  quote_post: MyPostQuotepost;
  thread: MyPostThread;
  type: MyPostType;
  forum: MyPostForum;
  created_at_desc: string;
}

interface MyPostForum {
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
  type: MyPostType;
  link_url: string;
}

interface MyPostType {
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

interface MyPostQuotepost {
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
  deleted_at: null;
  user: MyPostUser;
  quote_user: MyPostUser;
  thread: MyPostThread;
  group_forum: MyPostGroupforum;
}

interface MyPostGroupforum {
  id: number;
  user_id: number;
  group_id: number;
  forum_id: number;
  orderby: number;
  group: MyPostGroup;
}

interface MyPostGroup {
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

interface MyPostThread {
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
  deleted_at: null;
  Language: string;
}

interface MyPostUser {
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
  levels: MyPostLevels;
}

interface MyPostLevels {
  id: number;
  level_name: string;
  color_id: number;
  level_icon: string;
  admin: string;
  min: number;
  max: number;
  created_at: string;
  updated_at: string;
  deleted_at: null;
}

export interface MyFavoriteResponse {
  data: MyFavoriteDatum[];
  total_count: number;
  total_limit: number;
  total_offset: number;
}

interface MyFavoriteDatum {
  id: number;
  oid: number;
  idtype: string;
  user_id: number;
  title: string;
  user: MyPostUser;
  thread: MyPostThread;
  forum: MyPostForum;
  created_at: string;
  updated_at: string;
  created_at_desc: string;
  updated_at_desc: string;
}

export interface UserInfoResponse {
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
