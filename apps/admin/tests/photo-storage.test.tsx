import { describe, expect, it } from "vitest";
import { photoObjectKey } from "../src/photos/storage";
import { MemoryPhotoStorage } from "../src/photos/storage-memory";

describe("photoObjectKey", () => {
  it("builds stable keys from the photo ID and width", () => {
    expect(photoObjectKey("photo-1", 480)).toBe("photos/photo-1/480.webp");
  });

  it("rejects IDs that could escape the photo prefix", () => {
    for (const id of ["", " ", "../x", "a/b", "a\\b", "a b"]) {
      expect(() => photoObjectKey(id, 480)).toThrow(RangeError);
    }
  });
});

describe("MemoryPhotoStorage", () => {
  it("stores, reads, and deletes objects", async () => {
    const storage = new MemoryPhotoStorage();
    await storage.put("k", new Uint8Array([1]), "image/webp");

    expect(storage.get("k")).toEqual({
      bytes: new Uint8Array([1]),
      contentType: "image/webp",
    });
    expect(storage.keys()).toEqual(["k"]);

    await storage.delete("k");
    expect(storage.get("k")).toBeNull();
  });

  it("reports whether an object exists", async () => {
    const storage = new MemoryPhotoStorage();
    await storage.put("k", new Uint8Array([1]), "image/webp");

    await expect(storage.exists("k")).resolves.toBe(true);
    await expect(storage.exists("other")).resolves.toBe(false);
  });

  it("treats deleting a missing key as success", async () => {
    await expect(new MemoryPhotoStorage().delete("missing")).resolves.toBe(
      undefined,
    );
  });
});
