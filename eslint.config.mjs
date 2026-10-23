import { fixupConfigRules } from "@eslint/compat";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  // Generated output, like the default .next ignore.
  { ignores: [".next-e2e/**", "test-results/**", "playwright-report/**"] },
  ...fixupConfigRules([...coreWebVitals, ...typescript]),
];

export default config;
