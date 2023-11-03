const SERVER = "https://bbs.deepin.org.cn";

module.exports = {
  env: {
    NODE_ENV: '"development"',
    SERVER: JSON.stringify(SERVER),
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
          target: SERVER,
          changeOrigin: true,
        },
        "/assets": {
          target: SERVER,
          changeOrigin: true,
        },
      },
    },
  },
};
