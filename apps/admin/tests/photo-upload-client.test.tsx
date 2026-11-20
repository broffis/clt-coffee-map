import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadPhotoRequest } from "../src/editor/photo-upload-client";

const file = new File([new Uint8Array([1, 2, 3])], "front.jpg", {
  type: "image/jpeg",
});
const variants = [{ width: 480, height: 320, key: "photos/p1/480.webp" }];

function respond(status: number, body: unknown) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(Response.json(body, { status }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("uploadPhotoRequest", () => {
  it("posts the raw file with session cookies and returns the photo", async () => {
    const fetch = respond(200, { ok: true, id: "p1", variants });

    await expect(uploadPhotoRequest(file)).resolves.toEqual({
      ok: true,
      photo: { id: "p1", variants },
    });

    expect(fetch).toHaveBeenCalledWith("/api/admin/photos", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "image/jpeg" },
      body: file,
    });
  });

  it.each([413, 422])(
    "shows the server's message for HTTP %s",
    async (status) => {
      respond(status, {
        ok: false,
        errors: { form: "Photos must be 10 MB or smaller." },
      });

      await expect(uploadPhotoRequest(file)).resolves.toEqual({
        ok: false,
        message: "Photos must be 10 MB or smaller.",
      });
    },
  );

  it.each([
    [401, "Your session could not be verified. Please sign in again."],
    [403, "This account is not approved to upload photos."],
    [503, "Photo uploads are unavailable right now. Try again later."],
    [500, "The photo could not be uploaded. Try again."],
  ])("maps HTTP %s to a safe message", async (status, message) => {
    respond(status, { error: "secret detail" });

    await expect(uploadPhotoRequest(file)).resolves.toEqual({
      ok: false,
      message,
    });
  });

  it("falls back when a 422 body or a 200 body is unusable", async () => {
    const generic = "The photo could not be uploaded. Try again.";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("nope", { status: 422 }),
    );
    await expect(uploadPhotoRequest(file)).resolves.toEqual({
      ok: false,
      message: generic,
    });

    respond(200, { ok: true });
    await expect(uploadPhotoRequest(file)).resolves.toEqual({
      ok: false,
      message: generic,
    });
  });

  it("uploads the downscaled file instead of an oversized original", async () => {
    const shrunk = new File([new Uint8Array([9])], "front.jpg", {
      type: "image/jpeg",
    });
    const fetch = respond(200, { ok: true, id: "p1", variants });

    await uploadPhotoRequest(file, async () => shrunk);

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/photos",
      expect.objectContaining({ body: shrunk }),
    );
  });

  it("explains when a photo cannot be shrunk enough", async () => {
    const fetch = respond(200, {});

    await expect(uploadPhotoRequest(file, async () => null)).resolves.toEqual({
      ok: false,
      message:
        "This photo is too large to upload and could not be shrunk. Try a smaller image.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports network failures", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    await expect(uploadPhotoRequest(file)).resolves.toEqual({
      ok: false,
      message:
        "The photo could not be uploaded. Check your connection and try again.",
    });
  });
});
