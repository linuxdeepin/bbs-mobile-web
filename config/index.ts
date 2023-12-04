import Components from "unplugin-vue-components/webpack";
import NutUIResolver from "@nutui/nutui-taro/dist/resolver";
import path from "path";

const config = {
  projectName: "deepin-bbs",
  date: "2023-9-20",
  designWidth(input) {
    if (input?.file?.replace(/\\+/g, "/").indexOf("@nutui") > -1) {
      return 375;
    }
    return 750;
  },
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
    375: 2 / 1,
  },
  sourceRoot: "src",
  outputRoot: `dist/${process.env.TARO_ENV}`,
  plugins: [
    "@tarojs/plugin-html",
    ["@tarojs/plugin-http", { enableCookie: true }],
  ],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {},
  },
  framework: "vue3",
  compiler: {
    type: "webpack5",
    prebundle: { enable: false },
  },
  sass: {
    data: `@import "@nutui/nutui-taro/dist/styles/variables.scss";`,
  },
  mini: {
    miniCssExtractPluginOption: {
      ignoreOrder: true,
    },
    webpackChain(chain) {
      chain.plugin("unplugin-vue-components").use(
        Components({
          resolvers: [NutUIResolver({ taro: true })],
        })
      );
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {
          // selectorBlackList: ['nut-']
        },
      },
      url: {
        enable: true,
        config: {
          limit: 1024, // 设定转换尺寸上限
        },
      },
      cssModules: {
        enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        config: {
          namingPattern: "module", // 转换模式，取值为 global/module
          generateScopedName: "[name]__[local]___[hash:base64:5]",
        },
      },
    },
  },
  h5: {
    webpackChain(chain) {
      chain.plugin("unplugin-vue-components").use(
        Components({
          resolvers: [NutUIResolver({ taro: true })],
        })
      );
    },
    router: {
      mode: "browser",
    },
    publicPath: "/",
    staticDirectory: "static",
    esnextModules: ["nutui-taro", "icons-vue-taro"],
    postcss: {
      autoprefixer: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        config: {
          namingPattern: "module", // 转换模式，取值为 global/module
          generateScopedName: "[name]__[local]___[hash:base64:5]",
        },
      },
    },
  },
  // 配置目录别名
  alias: {
    "@/assets": path.resolve(__dirname, "..", "src/assets"),
    "@/stores": path.resolve(__dirname, "..", "src/stores"),
    "@/widgets": path.resolve(__dirname, "..", "src/widgets"),
  },
};

module.exports = function (merge) {
  if (process.env.NODE_ENV === "development") {
    return merge({}, config, require("./dev"));
  }
  return merge({}, config, require("./prod"));
};
