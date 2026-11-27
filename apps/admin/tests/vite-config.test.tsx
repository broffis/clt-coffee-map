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

it("loads local editor database and location settings without overriding process values", () => {
  vi.stubEnv("MONGODB_WRITE_URI", undefined);
  vi.stubEnv("MONGODB_WRITE_DB_NAME", "existing-database");
  vi.stubEnv("DEFAULT_REGION_ID", undefined);
  vi.stubEnv("DEFAULT_CITY_ID", undefined);
  loadEnv.mockReturnValue({
    MONGODB_WRITE_URI: "mongodb://localhost:27017",
    MONGODB_WRITE_DB_NAME: "local-database",
    DEFAULT_REGION_ID: "region-1",
    DEFAULT_CITY_ID: "city-1",
  });
  if (typeof config !== "function") {
    throw new Error("Expected an admin Vite configuration function.");
  }
  config({
    mode: "test",
    command: "serve",
    isSsrBuild: false,
    isPreview: false,
  });

  expect(process.env.MONGODB_WRITE_URI).toBe("mongodb://localhost:27017");
  expect(process.env.MONGODB_WRITE_DB_NAME).toBe("existing-database");
  expect(process.env.DEFAULT_REGION_ID).toBe("region-1");
  expect(process.env.DEFAULT_CITY_ID).toBe("city-1");
});
