import { http } from "./http";

export async function CreateThreadPost(body: CreatePostRequest) {
  return http
    .post<CreatePostResponse>("/api/v1/post", body, {
      params: { captcha_id: body.captcha_id },
    })
    .then((resp) => {
      if (resp.data.code != 0) {
        throw resp.data.msg;
      }
      return resp;
    });
}

interface CreatePostRequest {
  captcha_id: string;
  validate: string;
  forum_id: number;
  thread_id: number;
  message: string;
  quote_user_id: number;
  quote_post_id?: number;
  user_ids?: number[];
}

interface CreatePostResponse {
  code: number;
  data: {
    id: number;
    offset: number;
  };
  msg: string;
}
