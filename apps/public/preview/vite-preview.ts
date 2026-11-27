import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Plugin } from "vite";

export function discoveryPreview(): Plugin {
  return {
    name: "discovery-preview",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (
          request.method !== "GET" ||
          request.url?.split("?")[0] !== "/__preview/discovery"
        ) {
          next();
          return;
        }
        void readFile(join(server.config.root, "preview/index.html"), "utf8")
          .then((html) =>
            server.transformIndexHtml("/__preview/discovery", html),
          )
          .then((html) => {
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.setHeader("Cache-Control", "no-store");
            response.end(html);
          })
          .catch(next);
      });
    },
  };
}
