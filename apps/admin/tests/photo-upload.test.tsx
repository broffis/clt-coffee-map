import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { SessionVerifier } from "../src/authentication/session";
import { approveAccess } from "../src/domain/access";
import { createInMemoryAccessRepository } from "../src/persistence/access-memory";
import { PersistenceError } from "../src/persistence/errors";
import { MAX_UPLOAD_BYTES } from "../src/photos/processing";
import { MemoryPhotoStorage } from "../src/photos/storage-memory";
import { handlePhotoUpload } from "../src/photos/upload-handler";

const NOW = new Date("2026-11-18T20:00:00.000Z");
const verified: SessionVerifier<Request> = {
  verify: async () => ({ userId: "user_editor" }),
};

function upload(
  body: BodyInit | null,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://admin.example.test/api/admin/photos", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", ...headers },
    body,
  });
}

async function jpeg(
  width = 1000,
  height = 600,
): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await sharp({
    create: { width, height, channels: 3, background: "#884422" },
  })
    .jpeg()
    .toBuffer();
  return new Uint8Array(buffer);
}

async function setup() {
  const access = createInMemoryAccessRepository();
  await access.save(approveAccess(null, "user_editor", NOW));
  const storage = new MemoryPhotoStorage();
  return {
    storage,
    deps: { access, verifier: verified, storage, newId: () => "photo-1" },
  };
}

describe("photo upload endpoint", () => {
  it("stores processed variants and returns their keys", async () => {
    const { storage, deps } = await setup();

    const response = await handlePhotoUpload(deps, upload(await jpeg()));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      ok: true,
      id: "photo-1",
      variants: [
        { width: 480, height: 288, key: "photos/photo-1/480.webp" },
        { width: 960, height: 576, key: "photos/photo-1/960.webp" },
      ],
    });
    expect(storage.keys()).toEqual([
      "photos/photo-1/480.webp",
      "photos/photo-1/960.webp",
    ]);
    expect(storage.get("photos/photo-1/480.webp")?.contentType).toBe(
      "image/webp",
    );
  });

  it("ignores the client-declared content type", async () => {
    const { deps } = await setup();

    const response = await handlePhotoUpload(
      deps,
      upload(await jpeg(), { "Content-Type": "text/plain" }),
    );

    expect(response.status).toBe(200);
  });

  it("returns 422 with a message and stores nothing for invalid photos", async () => {
    const { storage, deps } = await setup();

    const response = await handlePhotoUpload(
      deps,
      upload(new TextEncoder().encode("not an image")),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ok: false,
      errors: { form: "Use a JPEG, PNG, or WebP photo." },
    });
    expect(storage.keys()).toEqual([]);
  });

  it("returns 422 for an empty body", async () => {
    const { deps } = await setup();

    const response = await handlePhotoUpload(deps, upload(null));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      ok: false,
      errors: { form: "Choose a photo to upload." },
    });
  });

  it("returns 413 from the declared length without reading the body", async () => {
    const { deps } = await setup();

    const response = await handlePhotoUpload(
      deps,
      upload("x", { "Content-Length": String(MAX_UPLOAD_BYTES + 1) }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      ok: false,
      errors: { form: "Photos must be 10 MB or smaller." },
    });
  });

  it("returns 413 when the body exceeds the limit without a length header", async () => {
    const { storage, deps } = await setup();

    const response = await handlePhotoUpload(
      deps,
      upload(new Uint8Array(MAX_UPLOAD_BYTES + 1)),
    );

    expect(response.status).toBe(413);
    expect(storage.keys()).toEqual([]);
  });

  it("returns 401 for an unsigned request before reading the body", async () => {
    const { storage, deps } = await setup();

    const response = await handlePhotoUpload(
      { ...deps, verifier: { verify: async () => null } },
      upload(await jpeg()),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
    expect(storage.keys()).toEqual([]);
  });

  it("returns 403 without upload approval", async () => {
    const { storage, deps } = await setup();

    const response = await handlePhotoUpload(
      { ...deps, access: createInMemoryAccessRepository() },
      upload(await jpeg()),
    );

    expect(response.status).toBe(403);
    expect(storage.keys()).toEqual([]);
  });

  it("removes already-stored variants and returns 503 when storage fails", async () => {
    const { storage, deps } = await setup();
    let puts = 0;
    const failing = {
      put: async (key: string, bytes: Uint8Array, type: string) => {
        puts += 1;
        if (puts === 2) {
          throw new PersistenceError("unavailable", "provider detail");
        }
        await storage.put(key, bytes, type);
      },
      exists: (key: string) => storage.exists(key),
      delete: (key: string) => storage.delete(key),
    };

    const response = await handlePhotoUpload(
      { ...deps, storage: failing },
      upload(await jpeg()),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "unavailable" });
    expect(storage.keys()).toEqual([]);
  });
});
