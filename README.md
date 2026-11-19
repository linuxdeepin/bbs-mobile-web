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

## Markdown 与发送限制

回帖和私信在页面中显示输入入口，点击后弹出 Markdown 编辑面板，收起时保留草稿；回复指定用户时自动打开面板。发帖编辑器直接显示。三处均支持 Markdown 工具栏与实时预览，输入时同步显示标题、列表、引用、代码块、链接和表格，也可收起实时预览或单独打开预览。正文同时兼容已有 HTML；宽表格可横向滚动。

发送内容使用论坛 v2 格式，携带 Base64 UTF-8 编码的 Markdown 原文（`data-value`）和经过清理的 HTML。上传图片也写入 Markdown 原文，便于网页版正确渲染表格、图片和继续编辑。

支持 `:agree:` 等论坛表情，预览及正文统一使用完整图片地址和固定尺寸。旧回帖中地址为空但仍保留表情名称的图片，会在显示时恢复，无需重新发送。

发帖内容最多 5000 字、9 张图片；回帖最多 1000 字、5 张图片，每张图片最多 2 MiB。发送期间锁定输入和重复提交，失败保留草稿以便重试。

同一账号成功发送主题或回复后冷却 10 秒；60 秒内拦截同一主题下内容、附件相同的回复。记录保存在当前设备，刷新或重新进入页面仍然生效。规则集中在 `src/utils/submission.ts`。这些是客户端限制，服务端仍需实现限流、长度校验和幂等去重，才能覆盖多设备和直接调用接口的情况。

## 验证

- `pnpm test`：Markdown、发送保护和审查问题的回归测试。
- `pnpm typecheck`：检查 TypeScript 源文件，跳过既有第三方声明错误，不覆盖 Vue 模板类型。
- `NODE_ENV=production pnpm build:h5` 与 `NODE_ENV=production pnpm build:weapp`：两端生产构建。
- 小程序构建会额外检查整个 `dist/weapp` 下的 JavaScript，限制为 ES2019 语法，提前发现微信上传器不接受的类字段、`??=` 等语法；也可单独运行 `pnpm check:weapp`。新增 Markdown/HTML 依赖及其运行时依赖已加入小程序 Babel 编译范围，无需修改微信开发者工具的 ES6 编译开关。
- 首次执行 `pnpm exec playwright install chromium`，构建 H5 后运行 `pnpm test:ui`：移动端表格滚动、编辑工具栏和预览测试。测试使用本地模拟接口，不访问生产服务。

## 特别鸣谢

1. [Taro](https://github.com/NervJS/taro)
2. [NutUI](https://github.com/jdf2e/nutui)
3. [Vue.js](https://github.com/vuejs/core)
4. 🧑‍💻 [student-ice](https://github.com/student-ice)
