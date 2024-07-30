import { http } from "./http";

export async function ForumById(opt: { id: number, order: string, offset: number, languages: string }) {
  return http.get<ForumByIdResponse>("/api/v1/forum/id", { params: { ...opt } })
}

export async function ForumIsFavorite(forumId: number) {
  return http.get<{ code: number, data: boolean, msg: string }>("/api/v1/forum/user/favorite", { params: { forum_id: forumId } })
}

// 收藏或取消收藏版块
export async function ForumFavorite(forumId: number) {
  return http.post<{ code: number, msg: string }>("/api/v1/forum/favorite", { id: forumId })
}

// 获取用户收藏的版块
export async function UserForumFavoriteList() {
  return http.get<UserForumFavoriteListResponse>("/api/v1/forum/favorite/list")
}

export interface ForumByIdResponse {
  data: ForumByIdData;
  total_count: number;
  total_limit: number;
  total_offset: number;
}

interface ForumByIdData {
  id: number;
  name: string;
  rank: number;
  ranking: number;
  threads_cnt: number;
  posts_cnt: number;
  visit_cnt: number;
  today_posts_cnt: number;
  today_threads_cnt: number;
  today_visit_cnt: number;
  brief: string;
  announcement: string;
  icon: string;
  is_favorite: boolean;
  thread: Thread[];
  type: Type2;
  user_list: Userlist[];
}

interface Userlist {
  id: number;
  group_type: number;
  username: string;
  nickname: string;
  avatar: string;
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

interface Thread {
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
  post: null;
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

interface UserForumFavoriteListResponse {
  code: number;
  data: UserFavoriteForumData[];
  msg: string;
}

interface UserFavoriteForumData {
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