import { afterEach, expect, it } from "vitest";
import { createServer, type ViteDevServer } from "vite";
import { discoveryPreview } from "../preview/vite-preview";

let server: ViteDevServer | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
});

it("serves the mock discovery preview only through the development server", async () => {
  const plugin = discoveryPreview();
  expect(plugin.apply).toBe("serve");
  expect(plugin.configurePreviewServer).toBeUndefined();
  server = await createServer({
    configFile: false,
    root: "apps/public",
    publicDir: false,
    plugins: [plugin],
    server: { host: "127.0.0.1", port: 0 },
    logLevel: "silent",
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (
    address === null ||
    address === undefined ||
    typeof address === "string"
  ) {
    throw new Error("Expected a development server address.");
  }
  const response = await fetch(
    `http://127.0.0.1:${address.port}/__preview/discovery`,
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("text/html");
  expect(await response.text()).toContain("/preview/discovery.tsx");
});
