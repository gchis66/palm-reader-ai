/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for the app
  output: "export",

  // Disable server components since we're using client-side rendering
  reactStrictMode: true,

  // Configure image domains if needed
  images: {
    unoptimized: true,
  },

  // Disable the requirement for trailing slashes
  trailingSlash: false,
};

export default nextConfig;
