import { http } from "./http";

export async function Message(opt: {
  page: number,
  pageSize: number,
  category: number,
}) {
  const params = {
    limit: opt.pageSize,
    offset: opt.page - 1,
    category: opt.category,
  }

  return http.get<MessageResponse>("/api/v1/user/msg", {
    params,
  })
}

export async function MessageDelete(params: { id: number }) {
  return http.delete<MessageReadResponse>("/api/v1/user/msg", { params })
}

export async function MessageCount() {
  return http.get<MessageCountResponse>("/api/v1/user/msg/count")
}
// 已读单条消息
export async function MessageRead(params: {
  id: number,
}) {
  return http.get<MessageReadResponse>("/api/v1/user/msg/read", { params })
}

// 已读全部消息
export async function MessageReadAll(params: { category: number }) {
  return http.get<MessageReadResponse>("/api/v1/user/msg/readAll", { params })
}

export async function PostOffset(params: { id: number, thread_id: number, page_size: number }) {
  return http.get<PostOffsetResponse>("/api/v1/user/post/offset", { params })
}

interface MessageResponse {
  data: MessageDatum[];
  total_count: number;
  total_limit: number;
  total_offset: number;
}

export interface MessageDatum {
  id: number;
  type: string;
  type_id: number;
  subject: string;
  forum_name: string;
  receive_user_id: number;
  receive_user_nickname: string;
  receive_user_avatar: string;
  send_user_id: number;
  send_user_nickname: string;
  send_user_avatar: string;
  message_fmt: string;
  send_message_fmt: string;
  note: string;
  is_new: number;
  from_id: number;
  send_post_id: number;
  thread_id: number;
  from_idtype: string;
  category: number;
  created_at: string;
}

interface MessageCountResponse {
  code: number;
  data: MessageCountResponseData;
  msg: string;
}

interface MessageCountResponseData {
  at_msg_count: number;
  letter_msg_count: number;
  post_msg_count: number;
  sys_msg_count: number;
  thread_msg_count: number;
}

interface MessageReadResponse {
  code: number;
  msg: string;
}

interface PostOffsetResponse {
  code: number;
  msg: string;
  offset: number;
}