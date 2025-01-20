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
  tabBar: {
    color: process.env.TARO_ENV === "h5" ? "#000" : "@tabBarTextColor",
    selectedColor: "#FA2C19",
    backgroundColor: "@tabBarBgColor",
    list: [
      {
        pagePath: "pages/index/index",
        text: "首页",
        iconPath: process.env.TARO_ENV === "h5" ? "assets/index.png" : "@indexIcon",
        selectedIconPath: "assets/index-selected.png",
      },
      {
        pagePath: "pages/module/module",
        text: "版块",
        iconPath: process.env.TARO_ENV === "h5" ? "assets/module.png" : "@moduleIcon",
        selectedIconPath: "assets/module-selected.png",
      },
      {
        pagePath: "pages/posting/posting",
        text: "发帖",
        iconPath: process.env.TARO_ENV === "h5" ? "assets/posting.png" : "@postingIcon",
        selectedIconPath: "assets/posting-selected.png",
      },
      {
        pagePath: "pages/message/message",
        text: "消息",
        iconPath: process.env.TARO_ENV === "h5" ? "assets/message.png" : "@messageIcon",
        selectedIconPath: "assets/message-selected.png",
      },
      {
        pagePath: "pages/account/account",
        text: "我的",
        iconPath: process.env.TARO_ENV === "h5" ? "assets/account.png" : "@accountIcon",
        selectedIconPath: "assets/account-selected.png",
      }
    ]
  },
  plugins: {
    // 网易易盾验证码
    captcha: {
      version: "1.3.0",
      provider: "wxb7c8f9ea9ceb4663",
    },
  },
});
