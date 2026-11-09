import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["apps/*/tests/**/*.test.tsx"],
    setupFiles: ["./tests/setup.ts"],
    env: {
      NODE_ENV: "test",
    },
    coverage: {
      provider: "v8",
      include: ["apps/*/src/**/*.{ts,tsx}"],
      exclude: ["**/routeTree.gen.ts", "**/*.d.ts"],
      reporter: ["text", "lcov", "json-summary"],
      thresholds: {
        branches: 90,
      },
    },
  },
});
