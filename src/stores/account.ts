import { defineStore } from "pinia";
import { ref } from "vue";

import { http } from "./http";
import Taro from "@tarojs/taro";
const initNECaptcha = import("./captcha.js");

const EmptyUserInfo = {
  nickname: "",
  avatar: "",
  username: "",
  desc: "",
  threads_cnt: 0,
  posts_cnt: 0,
  favourite_cnt: 0,
};

export const useAccountStore = defineStore("account", () => {
  const show_register = ref(false);
  const is_login = ref(false);
  const loaded = ref(false);
  const user_info = ref({ ...EmptyUserInfo });
  const isH5 = process.env.TARO_ENV === "h5";

  const useCaptcha = (captcha_id: string, type: "popup" | "verify") => {
    // 验证码组件的元素ID
    const elementID = "captcha_" + new Date().getTime();
    // 在小程序里获取网易验证码插件的元素
    const getElement = () => {
      const instance = Taro.getCurrentInstance();
      const page = instance.page;
      if (page && page.selectComponent) {
        const c = page.selectComponent("#" + elementID);
        return c as { popup: Function; verify: Function; reset: Function };
      }
      throw "not found captcha element";
    };

    // 在网易易盾生成的验证ID
    const captchaID = captcha_id;
    let callback = (_captchaCode: string) => {};
    // 验证成功后的回调函数
    const verify = (event: { detail: [string, string] }) => {
      const [err, validate] = event.detail;
      if (err) {
        return;
      }
      getElement().reset();
      callback(validate);
    };
    // 小程序中通过元素触发验证
    let tryVerify = async (callbackFunc: typeof callback) => {
      callback = callbackFunc;
      const c = getElement();
      if (type === "popup") {
        // 强制验证
        c.popup();
      } else {
        // 无感知验证
        c.verify();
      }
    };
    // html5中通过函数触发验证
    if (isH5) {
      tryVerify = async (callbackFunc: typeof callback) => {
        const init = await initNECaptcha;
        init.default(
          {
            element: document.body,
            captchaId: captchaID,
            width: "320px",
            mode: type === "popup" ? "popup" : "bind",
            onVerify: (_err: string, data: { validate: string }) => {
              if (data) {
                callbackFunc(data.validate);
              }
            },
          },
          function onload(instance) {
            if (type === "popup") {
              instance.popup();
            } else {
              instance.verify();
            }
          },
          function onerror(err) {
            console.warn(err);
          }
        );
      };
    }
    return { elementID, captchaID, verify, tryVerify };
  };
  // 智能验证，通过机器学习分析用户的环境和操作，可能会自动通过验证
  // 用于操作频繁且安全要求不高的场景，比如回帖和发帖
  const useSmartCaptcha = () => {
    return useCaptcha("f2c00d8c7cb64136a231e7f95f9c5e1a", "verify");
  };
  // 强制验证，相对于智能验证会自动通过，强制验证一定会弹出人机验证对话框
  // 用于操作不频繁但安全要求较高的场景，比如登陆和注册
  const useForceCaptcha = () => {
    return useCaptcha("8f1fbf7524c54854b28039db8f97e771", "popup");
  };
  // 刷新用户信息
  const refreshInfo = async () => {
    return getAccountInfo().then((info) => {
      loaded.value = true;
      is_login.value = true;
      user_info.value = {
        nickname: info.nickname,
        avatar: info.avatar,
        username: info.username,
        desc: info.desc,
        threads_cnt: info.threads_cnt,
        posts_cnt: info.posts_cnt,
        favourite_cnt: info.favourite_cnt,
      };
      return info;
    });
  };
  // 获取微信登陆的code
  const getLoginCode = () => {
    return new Promise<string>((resolve) => {
      Taro.login({
        success: (res: { code: string }) => {
          resolve(res.code);
        },
      });
    });
  };

  // 使用微信账号登陆
  const login = async () => {
    if (isH5) {
      const returnURL = encodeURIComponent(location.href);
      const redirectURL = encodeURIComponent(
        location.origin + "/api/v1/login/callback"
      );
      location.href = `/api/v1/login?return_url=${returnURL}&redirect_url=${redirectURL}`;
      throw "go to login";
    }
    try {
      const loginCode = await getLoginCode();
      await weappLogin(loginCode);
      refreshInfo();
      show_register.value = false;
    } catch (err) {
      console.log("weapp login", { err });
      // 如果登陆失败，并且账户未注册过deepinid，跳转到账户注册页面
      if (err?.response.status === 403) {
        console.log("go to register");
        show_register.value = true;
        Taro.navigateTo({
          url: "/pages/register/register",
        });
        throw "go to register";
      }
    }
  };
  const logout = async () => {
    const resp = await bbsLogout();
    if (isH5) {
      const url = new URL(resp.data.url);
      url.searchParams.set("callback", location.href);
      location.href = url.toString();
    }
    is_login.value = false;
    user_info.value = { ...EmptyUserInfo };
  };
  // 使用微信账号和手机号注册，为保证接口安全，这里传递的参数都是微信的code，后台用code从微信服务器查询实际信息
  const register = async (
    captchaID: string,
    captchaCode: string,
    phoneCode: string
  ) => {
    const loginCode = await getLoginCode();
    await weappRegister(captchaID, captchaCode, loginCode, phoneCode);
    login();
  };

  refreshInfo().finally(() => {
    loaded.value = true;
  });

  return {
    loaded,
    show_register,
    is_login,
    user_info,
    refreshInfo,
    login,
    logout,
    register,
    useSmartCaptcha,
    useForceCaptcha,
  };
});

async function getAccountInfo() {
  return http.get<AccountInfo>("/api/v1/login/is_login").then((resp) => {
    if (!resp.data) {
      throw "no login";
    }
    return resp.data;
  });
}

async function bbsLogout() {
  return http.post<{ url: string }>("/api/v1/login/logout");
}

// 小程序登陆接口
async function weappLogin(code: string) {
  return http.post("/api/v2/public/weixin/weapp/login", { code });
}

// 小程序注册接口
async function weappRegister(
  captcha_id: string,
  captcha_code: string,
  login_code: string,
  phone_code: string
) {
  const url = "/api/v2/public/weixin/weapp/register?captcha_id=" + captcha_id;
  const body = { login_code, phone_code };
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
