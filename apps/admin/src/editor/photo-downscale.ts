// Vercel Functions reject request bodies over 4.5 MB (ADR 0013), so oversized
// photos are shrunk in the browser first. The server's own 10 MB cap and
// processing still apply to whatever arrives.
export const UPLOAD_BODY_LIMIT_BYTES = 4_000_000;

const RESIZABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
// Long-edge attempts, largest first; the server never outputs above 1600 px.
const LONG_EDGES = [2400, 1800, 1200];
const JPEG_QUALITY = 0.85;

export type Resize = (
  file: File,
  longEdge: number,
  quality: number,
) => Promise<Blob | null>;

export async function fitUploadSize(
  file: File,
  resize: Resize = browserResize,
): Promise<File | null> {
  if (file.size <= UPLOAD_BODY_LIMIT_BYTES || !RESIZABLE_TYPES.has(file.type)) {
    return file;
  }
  for (const longEdge of LONG_EDGES) {
    const blob = await resize(file, longEdge, JPEG_QUALITY);
    if (blob === null) {
      return null;
    }
    if (blob.size <= UPLOAD_BODY_LIMIT_BYTES) {
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
        type: "image/jpeg",
      });
    }
  }
  return null;
}

// JPEG is encoded everywhere canvas exists; transparency is flattened onto
// white. createImageBitmap applies EXIF orientation by default.
export async function browserResize(
  file: File,
  longEdge: number,
  quality: number,
): Promise<Blob | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  try {
    const scale = Math.min(1, longEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (context === null) {
      return null;
    }
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
  } finally {
    bitmap.close();
  }
}
