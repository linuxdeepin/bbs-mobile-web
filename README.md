# deepin 社区论坛

用于构建 deepin 论坛的微信小程序和手机论坛

## web 调试

1. clone 仓库到本地，使用 `pnpm install` 初始化 node_module
2. 使用 `pnpm dev:h5`
3. 在浏览器打开 http://localhost:4200
4. 按 F12 打开开发者调试工具，使用设备切换按钮，切换为模拟手机设备

## 小程序调试

_由于微信限制打包体积，需要设置环境变量 `NODE_ENV=production`_

1. 前往 [微信公众平台](https://mp.weixin.qq.com) 注册一个小程序账号
2. 在小程序管理后台，点设置 -> 第三方设置 -> 添加插件 -> 网易易盾
3. 使用 `NODE_ENV=production pnpm dev:weapp` 编译项目
4. 打开微信开发者工具，选择小程序项目-导入项目，选择仓库目录，在导入界面 appid 选择你自己创建的小程序。
5. 在小程序模拟界面，点详情 -> 本地设置 -> 去掉“将 JS 编译成 ES5”，勾选“不校验合法域名”

## 特别鸣谢

1. [Taro](https://github.com/NervJS/taro)
2. [NutUI](https://github.com/jdf2e/nutui)
3. [Vue.js](https://github.com/vuejs/core)
