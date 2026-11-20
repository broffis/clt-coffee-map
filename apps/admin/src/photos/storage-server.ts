import "@tanstack/react-start/server-only";
import type { PhotoStorage } from "./storage";
import { createS3PhotoStorage, readPhotoStorageConfig } from "./storage-s3";

let storage: PhotoStorage | undefined;

// Resolved per call so missing credentials surface as a persistence error
// from the handler instead of failing at import time.
export const serverPhotoStorage: PhotoStorage = {
  put(key, bytes, contentType) {
    return resolve().put(key, bytes, contentType);
  },
  exists(key) {
    return resolve().exists(key);
  },
  delete(key) {
    return resolve().delete(key);
  },
};

function resolve(): PhotoStorage {
  storage ??= createS3PhotoStorage(readPhotoStorageConfig(process.env));
  return storage;
}
