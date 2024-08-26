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
  darkmode: true,
  themeLocation: "theme.json",
  window: {
    backgroundTextStyle: "@bgTextStyleColor",
    navigationBarBackgroundColor: "@navBarBgColor",
    navigationBarTitleText: "WeChat",
    navigationBarTextStyle: "@navBarTextStyle",
  },
  plugins: {
    // 网易易盾验证码
    captcha: {
      version: "1.3.0",
      provider: "wxb7c8f9ea9ceb4663",
    },
  },
});
