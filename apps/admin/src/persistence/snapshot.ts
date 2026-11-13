import { validateIdentifier } from "../domain/identifiers";
import { publishLocationDetails, type ShopLocation } from "../domain/location";
import { publishShopDetails, type Shop } from "../domain/shop";
import { byId } from "./checks";
import { PersistenceError } from "./errors";
import type { Repositories } from "./repositories";

export const SNAPSHOT_FORMAT = "clt-coffee-map-data";
const SNAPSHOT_VERSION = 1;

// Private, complete backup (drafts, sources, unpublished records). It is not
// the visitor-safe published export.
export interface DataSnapshot {
  readonly format: typeof SNAPSHOT_FORMAT;
  readonly version: typeof SNAPSHOT_VERSION;
  readonly shops: readonly Shop[];
  readonly locations: readonly ShopLocation[];
}

type Store = Pick<Repositories, "shops" | "locations">;
type RawRecord = Record<string, unknown> & { id: string };

function invalid(message: string): PersistenceError {
  return new PersistenceError("validation", `Invalid snapshot: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecordOrNull(value: unknown): boolean {
  return value === null || isRecord(value);
}

function hasSnapshotShape(value: unknown): value is RawRecord {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    isRecord(value.draft) &&
    isRecordOrNull(value.published)
  );
}

function checkRecord(
  value: unknown,
  label: string,
  seen: Set<string>,
): RawRecord {
  if (!hasSnapshotShape(value)) {
    throw invalid(`${label} has an unexpected shape.`);
  }
  try {
    validateIdentifier(value.id, `${label} ID`);
  } catch (error) {
    throw invalid((error as Error).message);
  }
  if (seen.has(value.id)) {
    throw invalid(`${label} ID "${value.id}" is duplicated.`);
  }
  seen.add(value.id);
  return value;
}

// Published data must satisfy the same rules as publishing; drafts may be incomplete.
function checkPublished(check: () => unknown, label: string): void {
  try {
    check();
  } catch (error) {
    throw invalid(`${label} is not publishable: ${(error as Error).message}`);
  }
}

function checkEnvelope(input: unknown): Record<string, unknown> {
  if (
    !isRecord(input) ||
    input.format !== SNAPSHOT_FORMAT ||
    input.version !== SNAPSHOT_VERSION
  ) {
    throw invalid("unrecognized format or version.");
  }
  if (!Array.isArray(input.shops) || !Array.isArray(input.locations)) {
    throw invalid("shops and locations must be lists.");
  }
  return input;
}

export function parseSnapshot(input: unknown): DataSnapshot {
  const { shops: rawShops, locations: rawLocations } = checkEnvelope(input) as {
    shops: unknown[];
    locations: unknown[];
  };

  const shopIds = new Set<string>();
  const shops = rawShops.map((value): Shop => {
    const shop = checkRecord(value, "Shop", shopIds) as unknown as Shop;
    const { published } = shop;
    if (published !== null) {
      checkPublished(
        () => publishShopDetails({ ...shop, draft: published }),
        `Shop "${shop.id}"`,
      );
    }
    return shop;
  });

  const locationIds = new Set<string>();
  const locations = rawLocations.map((value): ShopLocation => {
    const location = checkRecord(
      value,
      "Location",
      locationIds,
    ) as unknown as ShopLocation;
    if (!shopIds.has(location.shopId)) {
      throw invalid(`Location "${location.id}" references an unknown shop.`);
    }
    const { published } = location;
    if (published !== null) {
      checkPublished(
        () => publishLocationDetails({ ...location, draft: published }),
        `Location "${location.id}"`,
      );
    }
    return location;
  });

  return {
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    shops,
    locations,
  };
}

export async function exportSnapshot(store: Store): Promise<DataSnapshot> {
  const shops = [...(await store.shops.list())].sort(byId);
  const locations = (
    await Promise.all(shops.map((shop) => store.locations.listByShop(shop.id)))
  )
    .flat()
    .sort(byId);

  return {
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    shops,
    locations,
  };
}

// Restores into an empty database only, so an import cannot overwrite curated
// data. Validation finishes before any write; the writes themselves are not
// atomic, so retry into a cleared database after a mid-import failure.
export async function importSnapshot(
  store: Store,
  input: unknown,
): Promise<void> {
  const snapshot = parseSnapshot(input);
  if ((await store.shops.list()).length > 0) {
    throw new PersistenceError(
      "conflict",
      "Import requires an empty database.",
    );
  }
  for (const shop of snapshot.shops) {
    await store.shops.save(shop);
  }
  for (const location of snapshot.locations) {
    await store.locations.save(location);
  }
}
