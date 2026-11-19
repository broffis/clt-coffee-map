import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const name of ["MONGODB_URI", "MONGODB_DB_NAME"]) {
    if (env[name] !== undefined) {
      process.env[name] ??= env[name];
    }
  }
  return {
    publicDir: "../../static",
    plugins: [
      tanstackStart({
        prerender: {
          enabled: true,
          autoStaticPathsDiscovery: false,
          crawlLinks: false,
          retryCount: 0,
          failOnError: true,
        },
        pages: [{ path: "/", prerender: { enabled: true } }],
      }),
      viteReact(),
    ],
  };
});
