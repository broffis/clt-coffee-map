import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";
import { PersistenceError } from "../src/persistence/errors";
import {
  createS3PhotoStorage,
  readPhotoStorageConfig,
  S3PhotoStorage,
} from "../src/photos/storage-s3";

const env = {
  PHOTO_STORAGE_ENDPOINT: "https://t3.storage.dev",
  PHOTO_STORAGE_BUCKET: "clt-coffee-photos",
  PHOTO_STORAGE_ACCESS_KEY_ID: "id",
  PHOTO_STORAGE_SECRET_ACCESS_KEY: "secret",
};

describe("readPhotoStorageConfig", () => {
  it("reads settings and defaults the region to auto", () => {
    expect(readPhotoStorageConfig(env)).toEqual({
      endpoint: "https://t3.storage.dev",
      bucket: "clt-coffee-photos",
      region: "auto",
      accessKeyId: "id",
      secretAccessKey: "secret",
    });
    expect(
      readPhotoStorageConfig({ ...env, PHOTO_STORAGE_REGION: "iad" }).region,
    ).toBe("iad");
  });

  it("names the missing setting without echoing secrets", () => {
    for (const name of Object.keys(env)) {
      const partial = { ...env, [name]: " " };
      expect(() => readPhotoStorageConfig(partial)).toThrow(
        new PersistenceError("configuration", `${name} must be set.`),
      );
    }
  });

  it("requires an HTTPS endpoint", () => {
    expect(() =>
      readPhotoStorageConfig({
        ...env,
        PHOTO_STORAGE_ENDPOINT: "http://localhost",
      }),
    ).toThrow("PHOTO_STORAGE_ENDPOINT must be an HTTPS URL.");
  });
});

describe("S3PhotoStorage", () => {
  it("puts objects with their content type", async () => {
    const send = vi.fn().mockResolvedValue({});
    const bytes = new Uint8Array([1, 2]);
    await new S3PhotoStorage({ send }, "bucket").put(
      "photos/a/480.webp",
      bytes,
      "image/webp",
    );

    const command = send.mock.calls[0]?.[0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Bucket: "bucket",
      Key: "photos/a/480.webp",
      Body: bytes,
      ContentType: "image/webp",
    });
  });

  it("deletes objects", async () => {
    const send = vi.fn().mockResolvedValue({});
    await new S3PhotoStorage({ send }, "bucket").delete("photos/a/480.webp");

    const command = send.mock.calls[0]?.[0] as DeleteObjectCommand;
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toEqual({
      Bucket: "bucket",
      Key: "photos/a/480.webp",
    });
  });

  it("reports provider failures as unavailable without details", async () => {
    const send = vi.fn().mockRejectedValue(new Error("secret endpoint detail"));
    const storage = new S3PhotoStorage({ send }, "bucket");

    for (const action of [
      () => storage.put("k", new Uint8Array(), "image/webp"),
      () => storage.delete("k"),
    ]) {
      const error = await action().catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(PersistenceError);
      expect(error).toMatchObject({ code: "unavailable" });
      expect((error as Error).message).not.toContain("secret");
    }
  });

  it("creates a client from validated configuration", () => {
    expect(createS3PhotoStorage(readPhotoStorageConfig(env))).toBeInstanceOf(
      S3PhotoStorage,
    );
  });
});
