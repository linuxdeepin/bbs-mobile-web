# deepin 社区论坛

支持构建微信小程序和 手机 web 论坛

## 小程序调试

_由于微信限制打包体积，需要先设置环境变量 `NODE_ENV=production` _

1. 使用 `pnpm dev:weapp` 编译项目，
2. 打开微信开发者工具，选择小程序项目-导入项目，选择本项目。

## web 调试

_需要取消配置 `NODE_ENV=production` 环境变量_

1. 使用 `pnpm dev:h5`
2. 在浏览器打开 http://localhost:4200
3. 按 F12 打开开发者调试工具，使用设备切换按钮，切换为模拟手机设备

## 特别鸣谢

1. [Taro](https://github.com/NervJS/taro)
2. [NutUI](https://github.com/jdf2e/nutui)
3. [Vue.js](https://github.com/vuejs/core)
