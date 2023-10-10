module.exports = {
  env: {
    NODE_ENV: '"development"',
    SERVER: '"https://bbs-pre.deepin.org.cn"',
  },
  defineConstants: {},
  mini: {},
  cache: {
    enable: true,
  },
  h5: {
    devServer: {
      port: 4200,
      allowedHosts: "all",
      proxy: {
        "/api": {
          target: "https://bbs-pre.deepin.org.cn",
          changeOrigin: true,
        },
        "/assets": {
          target: "https://bbs-pre.deepin.org.cn",
          changeOrigin: true,
        },
      },
    },
  },
};
