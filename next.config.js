/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.module\.less$/,
      use: [
        isServer
          ? {
              loader: 'css-loader',
              options: {
                esModule: false,
                modules: {
                  localIdentName: '[local]_[hash:base64:5]',
                  exportOnlyLocals: true,
                  namedExport: false,
                },
              },
            }
          : { loader: 'style-loader' },
        ...(isServer
          ? []
          : [
              {
                loader: 'css-loader',
                options: {
                  esModule: false,
                  modules: {
                    localIdentName: '[local]_[hash:base64:5]',
                    namedExport: false,
                  },
                },
              },
            ]),
        { loader: 'less-loader' },
      ],
    })
    return config
  },
}
module.exports = nextConfig
