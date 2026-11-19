import { createApp } from "vue";
import { createPinia } from "pinia";
import Taro from "@tarojs/taro";
import { useConfigStore, useSubscriptionStore } from "./stores";

import "./app.scss";

if (process.env.TARO_ENV !== "h5") {
  require("./utils/mini-html").installMiniHtmlEntityDecoding();
}

const App = createApp({});

App.use(createPinia());

const config = useConfigStore();
const subscribe = useSubscriptionStore();

Taro.getSystemInfo().then((res) => {
  console.log("程序启动获取系统主题", res.theme)
  config.setTheme(res.theme as string);
})

// 监听主题变化,更新store中的主题
Taro.onThemeChange(res => {
  console.log("系统主题改变", res.theme);
  config.setTheme(res.theme as string);
})

subscribe.getSetting()
subscribe.getSeverSubscribe()

export default App;
