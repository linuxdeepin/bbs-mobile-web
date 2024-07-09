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

interface MessageResponse {
  data: Datum[];
  total_count: number;
  total_limit: number;
  total_offset: number;
}

export interface Datum {
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