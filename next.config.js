// CommonJS so the same policy can be required from this config and from unit tests.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { contentSecurityPolicy } = require("./csp.cjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // End-to-end tests build against the emulators into a separate directory.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      "lh3.googleusercontent.com",
      "lh4.googleusercontent.com",
      "lh5.googleusercontent.com",
      "lh6.googleusercontent.com",
    ].map((hostname) => ({ protocol: "https", hostname })),
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
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy({
              emulatorHost: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || null,
            }),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
