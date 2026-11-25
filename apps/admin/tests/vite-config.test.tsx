import { afterEach, expect, it, vi } from "vitest";

const loadEnv = vi.hoisted(() => vi.fn());
vi.mock("vite", async (importOriginal) => ({
  ...(await importOriginal<typeof import("vite")>()),
  loadEnv,
}));

import config from "../vite.config";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

it("loads local photo storage settings into the admin server environment", () => {
  const settings = {
    PHOTO_STORAGE_ENDPOINT: "https://t3.storage.dev",
    PHOTO_STORAGE_BUCKET: "private",
    PHOTO_STORAGE_REGION: "auto",
    PHOTO_STORAGE_ACCESS_KEY_ID: "test-id",
    PHOTO_STORAGE_SECRET_ACCESS_KEY: "test-secret",
    PHOTO_DELIVERY_BUCKET: "public",
  };
  for (const name of Object.keys(settings)) {
    vi.stubEnv(name, undefined);
  }
  loadEnv.mockReturnValue(settings);
  if (typeof config !== "function") {
    throw new Error("Expected an admin Vite configuration function.");
  }
  config({
    mode: "test",
    command: "serve",
    isSsrBuild: false,
    isPreview: false,
  });

  for (const [name, value] of Object.entries(settings)) {
    expect(process.env[name]).toBe(value);
  }
});
