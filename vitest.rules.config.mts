import { defineConfig } from "vitest/config";

/** Firestore security rules tests; run via `npm run test:rules` (starts the emulator) */
export default defineConfig({
  test: {
    environment: "node",
    include: ["rules/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
