import { http } from "./http";

export async function Letter(opt: { id: number, isRefresh: number, sort: number, offset: 0 }) {
  let params = {
    receive_user_id: opt.id,
    is_refresh: opt.isRefresh,
    sort: opt.sort,
    offset: opt.offset
  }

  return http.get<LetterResponse>("/api/v1/user/letter", { params });
}

export async function SendLetter(opt: { id: number, msg: String }) {
  return http.post<SendLetterResponse>("/api/v1/user/letter", {
    receive_user_id: opt.id,
    note: opt.msg
  });
}

export interface LetterResponse {
  code: number;
  data: Datum[];
  msg: string;
}

interface SendLetterResponse {
  code: number;
  data: Datum;
  msg: string;
}

interface Datum {
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