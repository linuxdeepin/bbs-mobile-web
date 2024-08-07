export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/thread/thread",
    "pages/register/register",
    "pages/account/account",
    "pages/search/search",
    "pages/message/message",
    "pages/notify/notify",
    "pages/dialog/dialog",
    "pages/mypost/mypost",
    "pages/favorite/favorite",
    "pages/posting/posting",
    "pages/module/module",
    "pages/module-detail/module-detail",
    "pages/user/user",
  ],
  window: {
    backgroundTextStyle: "dark",
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
