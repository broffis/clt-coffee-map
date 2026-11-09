import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
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
});
