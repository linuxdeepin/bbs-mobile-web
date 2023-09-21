module.exports = {
  env: {
    NODE_ENV: '"development"',
    SERVER: '"https://bbs.deepin.org"',
  },
  defineConstants: {},
  mini: {},
  h5: {
    devServer: {
      port: 4200,
      allowedHosts: "all",
      proxy: {
        "/api": {
          target: "https://bbs-pre.deepin.com",
          changeOrigin: true,
        },
      },
    },
  },
};
