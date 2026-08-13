/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    staleTimes: {
      dynamic: 3600,
      static: 3600,
    },
  },
};

module.exports = nextConfig;
