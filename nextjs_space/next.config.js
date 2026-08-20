/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ['next-auth', 'bcryptjs'],
  },
};

module.exports = nextConfig;
