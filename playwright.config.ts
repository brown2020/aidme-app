import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * End-to-end tests run the production build against the Firebase Auth and
 * Firestore emulators (started by `npm run test:e2e`), so they need no real
 * project or credentials.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-aidme.firebaseapp.com",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-aidme",
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "",
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:000000000000:web:e2e",
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "",
      NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY: "",
      NEXT_PUBLIC_FIREBASE_EMULATOR_HOST: "127.0.0.1",
    },
  },
});
