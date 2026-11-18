import type { SessionVerifier } from "../authentication/session";
import { requireRequestPermission } from "../authorization/request";
import type { LocationDetails, LocationType } from "../domain/location";
import type { AccessRepository } from "../persistence/access-repository";
import type { Repositories } from "../persistence/repositories";

const LOCATION_TYPES: readonly string[] = [
  "cafe",
  "bakery",
  "mobile coffee",
  "coffee roaster",
];

export interface RegionDefaults {
  readonly regionId: string;
  readonly cityId: string;
}

export interface LocationDraftDependencies {
  readonly access: Pick<AccessRepository, "get">;
  readonly repositories: Pick<Repositories, "shops" | "locations">;
  readonly verifier: SessionVerifier<Request>;
  readonly newId: () => string;
  // Region/city come from server configuration, never from the client.
  readonly defaults: RegionDefaults;
}

type ErrorField =
  | "form"
  | "shopId"
  | "type"
  | "streetLine1"
  | "streetLine2"
  | "postalCode"
  | "latitude"
  | "longitude"
  | "website";

export type LocationDraftErrors = Partial<Record<ErrorField, string>>;

export type LocationDraftResult =
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly errors: LocationDraftErrors };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function orNull(value: string): string | null {
  return value === "" ? null : value;
}

function parseCoordinate(value: string, limit: number): number | null {
  const number = value === "" ? Number.NaN : Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

export async function saveLocationDraft(
  deps: LocationDraftDependencies,
  request: Request,
  input: unknown,
): Promise<LocationDraftResult> {
  await requireRequestPermission(
    deps.access,
    deps.verifier,
    request,
    "shop:edit",
  );
  if (typeof input !== "object" || input === null) {
    return {
      ok: false,
      errors: { form: "Submitted location data is not valid." },
    };
  }
  const fields = input as Record<string, unknown>;
  const requestedId = text(fields.id);
  const shopId = text(fields.shopId);
  const type = text(fields.type);
  const streetLine1 = orNull(text(fields.streetLine1));
  const streetLine2 = orNull(text(fields.streetLine2));
  const postalCode = orNull(text(fields.postalCode));
  const latitudeText = text(fields.latitude);
  const longitudeText = text(fields.longitude);
  const website = text(fields.website);
  const errors: LocationDraftErrors = {};

  if (shopId === "" || (await deps.repositories.shops.get(shopId)) === null) {
    errors.shopId = "Choose an existing shop.";
  }
  if (!LOCATION_TYPES.includes(type)) {
    errors.type = "Choose a valid location type.";
  }
  let coordinates: LocationDetails["coordinates"] = null;
  if (latitudeText !== "" || longitudeText !== "") {
    const latitude = parseCoordinate(latitudeText, 90);
    const longitude = parseCoordinate(longitudeText, 180);
    if (latitudeText === "" || longitudeText === "") {
      errors[latitudeText === "" ? "latitude" : "longitude"] =
        "Enter both latitude and longitude.";
    }
    if (latitudeText !== "" && latitude === null) {
      errors.latitude = "Latitude must be between -90 and 90.";
    }
    if (longitudeText !== "" && longitude === null) {
      errors.longitude = "Longitude must be between -180 and 180.";
    }
    if (latitude !== null && longitude !== null) {
      coordinates = { latitude, longitude };
    }
  }
  if (website !== "" && !URL.canParse(website)) {
    errors.website = "Website URL must be a valid HTTPS URL.";
  } else if (website !== "" && new URL(website).protocol !== "https:") {
    errors.website = "Website URL must be a valid HTTPS URL.";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const existing =
    requestedId === ""
      ? null
      : await deps.repositories.locations.get(requestedId);
  if (requestedId !== "" && (existing === null || existing.shopId !== shopId)) {
    return { ok: false, errors: { form: "Location not found." } };
  }
  const base: LocationDetails = existing?.draft ?? {
    regionId: deps.defaults.regionId,
    cityId: deps.defaults.cityId,
    neighborhoodId: null,
    type: "cafe",
    coordinates: null,
    address: null,
    links: null,
    hoursInfoUrl: null,
    regularHours: null,
    roasters: null,
    coffeeOptions: null,
    nonCoffeeDrinks: null,
    food: null,
    sources: null,
  };
  const id = existing?.id ?? deps.newId();
  await deps.repositories.locations.save({
    id,
    shopId,
    draft: {
      ...base,
      type: type as LocationType,
      coordinates,
      address:
        streetLine1 === null && streetLine2 === null && postalCode === null
          ? null
          : { streetLine1, streetLine2, postalCode },
      links:
        website === "" ? null : { website, other: base.links?.other ?? [] },
    },
    published: existing?.published ?? null,
  });
  return { ok: true, id };
}
