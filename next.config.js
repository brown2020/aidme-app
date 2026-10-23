/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // End-to-end tests build against the emulators into a separate directory.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "microphone=(self), camera=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
