export interface PhotoStorage {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  // Deleting a missing key succeeds so cleanup can be retried.
  delete(key: string): Promise<void>;
}

export function photoObjectKey(photoId: string, width: number): string {
  if (!/^[A-Za-z0-9_-]+$/.test(photoId)) {
    throw new RangeError("Photo ID must be a safe object key segment.");
  }
  return `photos/${photoId}/${width}.webp`;
}
