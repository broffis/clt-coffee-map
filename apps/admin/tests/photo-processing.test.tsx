import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_BYTES,
  PHOTO_VARIANT_WIDTHS,
  processPhoto,
} from "../src/photos/processing";

function image(
  width: number,
  height: number,
  format: "jpeg" | "png" | "webp" | "gif" = "jpeg",
): Promise<Uint8Array> {
  return sharp({
    create: { width, height, channels: 3, background: "#884422" },
  })
    [format]()
    .toBuffer();
}

describe("processPhoto", () => {
  it("produces WebP variants no wider than the source", async () => {
    const result = await processPhoto(await image(1000, 500));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.variants.map((variant) => variant.width)).toEqual([480, 960]);
    for (const variant of result.variants) {
      expect(variant.contentType).toBe("image/webp");
      const meta = await sharp(variant.bytes).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBe(variant.width);
      expect(meta.height).toBe(variant.height);
    }
    expect(result.variants[0]?.height).toBe(240);
  });

  it("uses the full set of widths for large sources", async () => {
    const result = await processPhoto(await image(2400, 1200));

    expect(result.ok && result.variants.map((v) => v.width)).toEqual([
      ...PHOTO_VARIANT_WIDTHS,
    ]);
  });

  it("keeps one source-sized variant for small images", async () => {
    const result = await processPhoto(await image(300, 200, "png"));

    expect(result.ok && result.variants.map((v) => v.width)).toEqual([300]);
  });

  it("strips metadata such as EXIF location", async () => {
    const withExif = await sharp({
      create: { width: 600, height: 400, channels: 3, background: "#000" },
    })
      .jpeg()
      .withExif({ IFD0: { Copyright: "private" } })
      .toBuffer();
    const result = await processPhoto(withExif);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const variant of result.variants) {
      expect((await sharp(variant.bytes).metadata()).exif).toBeUndefined();
    }
  });

  it("applies EXIF orientation", async () => {
    const rotated = await sharp({
      create: { width: 800, height: 400, channels: 3, background: "#000" },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const result = await processPhoto(rotated);

    expect(result.ok && result.variants[0]).toMatchObject({
      width: 400,
      height: 800,
    });
  });

  it("rejects empty input", async () => {
    expect(await processPhoto(new Uint8Array())).toEqual({
      ok: false,
      code: "empty",
      message: "Choose a photo to upload.",
    });
  });

  it("rejects files over the size limit before decoding", async () => {
    const result = await processPhoto(new Uint8Array(MAX_UPLOAD_BYTES + 1));

    expect(result).toMatchObject({ ok: false, code: "too-large" });
  });

  it("rejects non-image content", async () => {
    const result = await processPhoto(new TextEncoder().encode("<svg/>"));

    expect(result).toMatchObject({ ok: false, code: "unsupported" });
  });

  it("rejects image formats outside the allowlist", async () => {
    const result = await processPhoto(await image(100, 100, "gif"));

    expect(result).toMatchObject({ ok: false, code: "unsupported" });
  });

  it("rejects images with too many pixels", async () => {
    const huge = await sharp({
      create: { width: 9000, height: 9000, channels: 3, background: "#fff" },
    })
      .png({ compressionLevel: 9 })
      .toBuffer();

    expect(await processPhoto(huge)).toMatchObject({
      ok: false,
      code: "too-many-pixels",
    });
  });

  it("reports a failure when the image data is truncated", async () => {
    const png = await image(800, 800, "png");

    expect(await processPhoto(png.slice(0, png.length - 200))).toMatchObject({
      ok: false,
      code: "processing-failed",
    });
  });
});
