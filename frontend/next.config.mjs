/** @type {import('next').NextConfig} **/
import { createRequire } from 'module';
import webpack from 'webpack';

const require = createRequire(import.meta.url);

const nextConfig =  {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        path: false,
        fs: false
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }
    return config;
  }
};

export default nextConfig
