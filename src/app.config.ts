export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/thread/thread",
    "pages/register/register",
    "pages/account/account",
    "pages/search/search",
    "pages/message/message"
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "WeChat",
    navigationBarTextStyle: "black",
  },
  plugins: {
    // 网易易盾验证码
    captcha: {
      version: "1.3.0",
      provider: "wxb7c8f9ea9ceb4663",
    },
  },
});
