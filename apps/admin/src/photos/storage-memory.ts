import type { PhotoStorage } from "./storage";

interface StoredObject {
  readonly bytes: Uint8Array;
  readonly contentType: string;
}

export class MemoryPhotoStorage implements PhotoStorage {
  readonly #objects = new Map<string, StoredObject>();

  async put(
    key: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<void> {
    this.#objects.set(key, { bytes, contentType });
  }

  async exists(key: string): Promise<boolean> {
    return this.#objects.has(key);
  }

  async delete(key: string): Promise<void> {
    this.#objects.delete(key);
  }

  get(key: string): StoredObject | null {
    return this.#objects.get(key) ?? null;
  }

  keys(): string[] {
    return [...this.#objects.keys()];
  }
}
