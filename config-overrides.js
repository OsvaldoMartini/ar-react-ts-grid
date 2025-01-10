const { ModuleFederationPlugin } = require("webpack").container;

module.exports = function override(config) {
  config.plugins.push(
    new ModuleFederationPlugin({
      name: "hostApp", // ou o nome do seu app
      remotes: {
        pageoneMFE: "pageoneMFE@http://localhost:3001/remoteEntry.js",
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: "^17.0.0" },
        "react-dom": {
          singleton: true,
          eager: true,
          requiredVersion: "^17.0.0",
        },
      },
    })
  );

  return config;
};
