/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  images: {
    domains: ["assets.aceternity.com"],
  },
};

export default nextConfig;
