const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api/gemini",
    createProxyMiddleware({
      target: "https://gemini.up.railway.app",
      changeOrigin: true,
    })
  );
};
