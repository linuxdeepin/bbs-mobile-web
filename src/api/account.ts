import { http } from "./http";

// 获取用户信息
export async function GetAccountInfo() {
  return http.get<AccountInfo>("/api/v1/login/is_login").then((resp) => {
    if (!resp.data) {
      throw "no login";
    }
    return resp.data;
  });
}

// 退出登陆
export async function bbsLogout() {
  return http.post<{ url: string }>("/api/v1/login/logout");
}

// 通过微信登陆
export async function LoginByCode(code: string) {
  return http.post("/api/v2/public/weixin/weapp/login", { code });
}

// 通过密码登陆
export async function LoginByPassword(
  captcha_id: string,
  captcha_code: string,
  login_code: string,
  username: string,
  password: string
) {
  const url = "/api/v2/public/weixin/weapp/login/password";
  const body = { login_code, username, password };
  const headers = {
    "x-captcha-id": captcha_id,
    "x-captcha-code": captcha_code,
  };
  return http.post<{ code: number; msg: string }>(url, body, { headers });
}

// 获取注册用的手机验证码
export async function RegisterCode(
  captcha_id: string,
  captcha_code: string,
  phone: string,
  login_code: string
) {
  const url =
    "/api/v2/public/weixin/weapp/register/code?captcha_id=" + captcha_id;
  const body = { login_code, phone };
  const headers = {
    "x-captcha-id": captcha_id,
    "x-captcha-code": captcha_code,
  };
  return http.post(url, body, { headers });
}

// 使用手机号验证码注册
export async function Register(
  captcha_id: string,
  captcha_code: string,
  login_code: string,
  phone: string,
  phone_code: string
) {
  const url = "/api/v2/public/weixin/weapp/register?captcha_id=" + captcha_id;
  const body = { login_code, phone, phone_code };
  const headers = {
    "x-captcha-id": captcha_id,
    "x-captcha-code": captcha_code,
  };
  return http.post(url, body, { headers });
}

interface AccountInfo {
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
