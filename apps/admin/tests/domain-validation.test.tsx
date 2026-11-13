import { describe, expect, it } from "vitest";
import { type ContactLinks, validateContactLinks } from "../src/domain/links";
import {
  type LocationDetails,
  publishLocationDetails,
  type ShopLocation,
} from "../src/domain/location";
import { type SourceReference, validateSources } from "../src/domain/sources";

function location(changes: Partial<LocationDetails> = {}): ShopLocation {
  return {
    id: "location-1",
    shopId: "shop-1",
    draft: {
      regionId: "region-1",
      cityId: "city-1",
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
      ...changes,
    },
    published: null,
  };
}

describe("domain validators", () => {
  it("accepts HTTPS contact links and rejects insecure or duplicate links", () => {
    const links: ContactLinks = {
      website: "https://example.com",
      other: [{ label: "Menu", url: "https://example.com/menu" }],
    };
    expect(() => validateContactLinks(links)).not.toThrow();
    expect(() =>
      validateContactLinks({ ...links, website: "http://example.com" }),
    ).toThrow(RangeError);
    expect(() =>
      validateContactLinks({
        ...links,
        other: [
          ...links.other,
          { label: "Menu", url: "https://example.com/other-menu" },
        ],
      }),
    ).toThrow(RangeError);
  });

  it("validates source metadata and supported fields", () => {
    const source: SourceReference<"name"> = {
      name: "Business website",
      url: "https://example.com",
      recordId: null,
      release: null,
      license: null,
      verifiedOn: "2020-01-01",
      fields: ["name"],
    };
    expect(() => validateSources([source], ["name"])).not.toThrow();
    expect(() =>
      validateSources([{ ...source, url: "http://example.com" }], ["name"]),
    ).toThrow(RangeError);
    expect(() =>
      validateSources([{ ...source, fields: [] }], ["name"]),
    ).toThrow(RangeError);
    expect(() =>
      validateSources([{ ...source, fields: ["links"] }], ["name"]),
    ).toThrow(RangeError);
  });

  it("validates location URLs, addresses, and curated option values", () => {
    expect(() =>
      publishLocationDetails(
        location({ hoursInfoUrl: "http://example.com/hours" }),
      ),
    ).toThrow(RangeError);
    expect(() =>
      publishLocationDetails({
        ...location(),
        draft: {
          ...location().draft,
          address: {
            streetLine1: null,
            streetLine2: null,
            postalCode: null,
          },
        },
      }),
    ).toThrow(RangeError);
    expect(() =>
      publishLocationDetails(
        location({ coffeeOptions: ["espresso", "espresso"] }),
      ),
    ).toThrow(RangeError);
    expect(() =>
      publishLocationDetails(
        location({ type: "invalid" as LocationDetails["type"] }),
      ),
    ).toThrow(RangeError);
  });
});
