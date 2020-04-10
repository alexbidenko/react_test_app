require('dotenv').config();
const webpack = require('webpack');
const withSass = require('@zeit/next-sass');

module.exports = withSass({
    webpack: (config) => {
        config.plugins.push(
          new webpack.EnvironmentPlugin(process.env)
        )
        return config
    },
    cssLoaderOptions: {
        url: false
    },
    exportTrailingSlash: true,
    exportPathMap: () => {
        return {
            '/': { page: '/' }
        };
    }
});
