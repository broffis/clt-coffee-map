import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const name of [
    "CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "ADMIN_ORIGIN",
    "MONGODB_URI",
    "MONGODB_DB_NAME",
  ]) {
    if (env[name] !== undefined) {
      process.env[name] ??= env[name];
    }
  }
  return {
    publicDir: false,
    plugins: [tanstackStart(), viteReact()],
  };
});
