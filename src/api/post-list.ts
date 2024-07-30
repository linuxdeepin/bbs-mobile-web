import { http } from "./http";

export async function ThreadPostList(
  id: number,
  opt: {
    page?: number;
    pageSize?: number;
  }
) {
  const params = {
    id,
    offset: 0,
    limit: 10,
  };
  // TODO(wurongjie) 由于历史遗留原因，offset被当作pageIndex用
  if (opt.page) {
    params.offset = opt.page - 1;
  }
  if (opt.pageSize) {
    params.limit = opt.pageSize;
  }
  return http.get<PostListResponse>("/api/v1/thread/post/list", {
    params,
  });
}

export interface PostListResponse {
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
