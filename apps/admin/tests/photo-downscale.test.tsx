import { afterEach, describe, expect, it, vi } from "vitest";
import {
  browserResize,
  fitUploadSize,
  UPLOAD_BODY_LIMIT_BYTES,
} from "../src/editor/photo-downscale";

function fileOf(size: number, type = "image/png", name = "front.png") {
  return new File([new Uint8Array(size)], name, { type });
}

const small = (size = 100) => new Blob([new Uint8Array(size)]);
const big = UPLOAD_BODY_LIMIT_BYTES + 1;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fitUploadSize", () => {
  it("returns files within the limit untouched", async () => {
    const file = fileOf(UPLOAD_BODY_LIMIT_BYTES);
    const resize = vi.fn();

    await expect(fitUploadSize(file, resize)).resolves.toBe(file);
    expect(resize).not.toHaveBeenCalled();
  });

  it("leaves unsupported types for the server to reject", async () => {
    const file = fileOf(big, "image/gif", "a.gif");

    await expect(fitUploadSize(file, vi.fn())).resolves.toBe(file);
  });

  it("downscales an oversized image to a JPEG that fits", async () => {
    const resize = vi.fn(async () => small());

    const result = await fitUploadSize(fileOf(big), resize);

    expect(resize).toHaveBeenCalledWith(expect.any(File), 2400, 0.85);
    expect(result).toBeInstanceOf(File);
    expect(result?.name).toBe("front.jpg");
    expect(result?.type).toBe("image/jpeg");
  });

  it("tries smaller sizes until the result fits", async () => {
    const resize = vi
      .fn()
      .mockResolvedValueOnce(small(UPLOAD_BODY_LIMIT_BYTES + 1))
      .mockResolvedValueOnce(small());

    const result = await fitUploadSize(fileOf(big), resize);

    expect(resize.mock.calls.map((call) => call[1])).toEqual([2400, 1800]);
    expect(result?.size).toBe(100);
  });

  it("gives up when no size fits or the browser cannot resize", async () => {
    await expect(
      fitUploadSize(
        fileOf(big),
        vi.fn(async () => small(UPLOAD_BODY_LIMIT_BYTES + 1)),
      ),
    ).resolves.toBeNull();
    await expect(
      fitUploadSize(
        fileOf(big),
        vi.fn(async () => null),
      ),
    ).resolves.toBeNull();
  });
});

describe("browserResize", () => {
  function stubBrowser(options: {
    context?: object | null;
    blob?: Blob | null;
    decode?: "ok" | "fail";
  }) {
    const close = vi.fn();
    const drawImage = vi.fn();
    const fillRect = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () =>
        options.context === undefined
          ? { drawImage, fillRect, fillStyle: "" }
          : options.context,
      toBlob: (done: (blob: Blob | null) => void) =>
        done(options.blob === undefined ? small() : options.blob),
    };
    vi.stubGlobal(
      "createImageBitmap",
      options.decode === "fail"
        ? vi.fn().mockRejectedValue(new Error("bad"))
        : vi.fn(async () => ({ width: 4000, height: 3000, close })),
    );
    vi.spyOn(document, "createElement").mockReturnValue(
      canvas as unknown as HTMLCanvasElement,
    );
    return { canvas, drawImage, fillRect, close };
  }

  it("scales the long edge, flattens onto white, and encodes JPEG", async () => {
    const { canvas, drawImage, fillRect, close } = stubBrowser({});

    const blob = await browserResize(fileOf(big), 2000, 0.8);

    expect(blob).toBeInstanceOf(Blob);
    expect([canvas.width, canvas.height]).toEqual([2000, 1500]);
    expect(fillRect).toHaveBeenCalled();
    expect(drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it("never upscales a smaller image", async () => {
    const { canvas } = stubBrowser({});

    await browserResize(fileOf(big), 6000, 0.8);

    expect([canvas.width, canvas.height]).toEqual([4000, 3000]);
  });

  it.each([
    ["cannot decode", { decode: "fail" as const }],
    ["has no 2d context", { context: null }],
    ["cannot encode", { blob: null }],
  ])("returns null when the browser %s", async (_name, options) => {
    stubBrowser(options);

    await expect(browserResize(fileOf(big), 2000, 0.8)).resolves.toBeNull();
  });
});
