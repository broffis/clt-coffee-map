import { afterEach, describe, expect, it, vi } from "vitest";
import { publicPhotoBaseUrl, readPublicPhotos } from "../src/public-photos";

const BASE = "https://photos.example.test";

function photo(id: string, widths: number[], alt = "Front counter") {
  return {
    id,
    alt,
    variants: widths.map((width) => ({
      width,
      height: width / 2,
      key: `photos/${id}/${width}.webp`,
    })),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("publicPhotoBaseUrl", () => {
  it("reads an HTTPS origin and trims trailing slashes", () => {
    vi.stubEnv("VITE_PUBLIC_PHOTO_BASE_URL", "https://photos.example.test/");

    expect(publicPhotoBaseUrl()).toBe(BASE);
  });

  it.each([undefined, "", "http://insecure.example.test", "not a url"])(
    "is unavailable for %s",
    (value) => {
      vi.stubEnv("VITE_PUBLIC_PHOTO_BASE_URL", value);

      expect(publicPhotoBaseUrl()).toBeNull();
    },
  );
});

describe("readPublicPhotos", () => {
  it("builds responsive sources from published variants", () => {
    expect(
      readPublicPhotos({ photos: [photo("p1", [960, 480, 1600])] }, BASE),
    ).toEqual([
      {
        id: "p1",
        alt: "Front counter",
        src: `${BASE}/photos/p1/1600.webp`,
        width: 1600,
        height: 800,
        srcSet: `${BASE}/photos/p1/480.webp 480w, ${BASE}/photos/p1/960.webp 960w, ${BASE}/photos/p1/1600.webp 1600w`,
      },
    ]);
  });

  it("returns nothing without a base URL or photos", () => {
    expect(readPublicPhotos({ photos: [photo("p1", [480])] }, null)).toEqual(
      [],
    );
    expect(readPublicPhotos({}, BASE)).toEqual([]);
    expect(readPublicPhotos({ photos: "nope" }, BASE)).toEqual([]);
  });

  it("skips malformed photos and keys outside the photo prefix", () => {
    const traversal = {
      id: "p2",
      alt: "x",
      variants: [{ width: 480, height: 240, key: "../secret/480.webp" }],
    };
    const photos = [
      null,
      { id: "p3", alt: "  ", variants: photo("p3", [480]).variants },
      { id: "p4", alt: "x", variants: "nope" },
      { id: "p5", alt: "x", variants: [] },
      { id: "p6", alt: "x", variants: [null] },
      {
        id: "p7",
        alt: "x",
        variants: [{ width: 0, height: 1, key: "photos/p7/0.webp" }],
      },
      traversal,
      photo("ok", [480]),
    ];

    expect(readPublicPhotos({ photos }, BASE).map((item) => item.id)).toEqual([
      "ok",
    ]);
  });
});
