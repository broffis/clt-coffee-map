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
    "MONGODB_WRITE_URI",
    "MONGODB_WRITE_DB_NAME",
    "DEFAULT_REGION_ID",
    "DEFAULT_CITY_ID",
    "PHOTO_STORAGE_ENDPOINT",
    "PHOTO_STORAGE_BUCKET",
    "PHOTO_STORAGE_REGION",
    "PHOTO_STORAGE_ACCESS_KEY_ID",
    "PHOTO_STORAGE_SECRET_ACCESS_KEY",
    "PHOTO_DELIVERY_BUCKET",
    "PUBLIC_REGENERATION_WEBHOOK_URL",
    "PUBLIC_REGENERATION_WEBHOOK_SECRET",
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
