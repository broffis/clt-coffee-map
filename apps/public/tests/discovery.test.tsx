import { describe, expect, it } from "vitest";
import {
  createDiscoveryShops,
  filterDiscoveryShops,
  formatLocation,
  getNeighborhoods,
  mapLocations,
} from "../src/discovery";

const shops = createDiscoveryShops([
  {
    id: "shop-1",
    details: { name: "Uptown Coffee" },
    locations: [
      {
        id: "location-1",
        shopId: "shop-1",
        details: {
          neighborhoodId: "Uptown",
          type: "cafe",
          coordinates: { latitude: 35.2271, longitude: -80.8431 },
          address: {
            streetLine1: "100 Main Street",
            streetLine2: null,
            postalCode: "28202",
          },
        },
      },
    ],
  },
  {
    id: "shop-2",
    details: { name: "Mobile Beans" },
    locations: [
      {
        id: "location-2",
        shopId: "shop-2",
        details: { type: "mobile coffee" },
      },
    ],
  },
]);

describe("discovery model", () => {
  it("filters by shop name and location metadata", () => {
    expect(
      filterDiscoveryShops(shops, {
        search: "uptown",
        neighborhoodId: "",
        type: "",
        mapBounds: null,
      }).map((shop) => shop.id),
    ).toEqual(["shop-1"]);
    expect(
      filterDiscoveryShops(shops, {
        search: "",
        neighborhoodId: "Uptown",
        type: "",
        mapBounds: null,
      })[0]?.locations.map((location) => location.id),
    ).toEqual(["location-1"]);
  });

  it("keeps list-only mobile shops out of map locations", () => {
    expect(mapLocations(shops).map((location) => location.shopId)).toEqual([
      "shop-1",
    ]);
  });

  it("supports type, neighborhood, and map-area filtering", () => {
    expect(getNeighborhoods(shops)).toEqual(["Uptown"]);
    expect(
      filterDiscoveryShops(shops, {
        search: "",
        neighborhoodId: "Uptown",
        type: "cafe",
        mapBounds: {
          north: 36,
          south: 35,
          east: -80,
          west: -81,
        },
      }),
    ).toHaveLength(1);
    expect(
      filterDiscoveryShops(shops, {
        search: "",
        neighborhoodId: "",
        type: "",
        mapBounds: {
          north: 35,
          south: 34,
          east: -80,
          west: -81,
        },
      }),
    ).toHaveLength(0);
  });

  it("ignores invalid coordinates and formats simple addresses", () => {
    const [shop] = createDiscoveryShops([
      {
        id: "shop-3",
        details: { name: "No Coordinates" },
        locations: [
          {
            id: "location-3",
            shopId: "shop-3",
            details: {
              coordinates: { latitude: 91, longitude: 0 },
              address: "100 Main Street",
              cityId: "Charlotte",
            },
          },
        ],
      },
    ]);

    expect(shop?.locations[0]?.coordinates).toBeNull();
    expect(shop?.locations[0] && formatLocation(shop.locations[0])).toBe(
      "100 Main Street, Charlotte",
    );
    expect(
      formatLocation({
        id: "location-4",
        shopId: "shop-3",
        shopName: "No Coordinates",
        neighborhoodId: null,
        type: null,
        coordinates: null,
        details: {},
      }),
    ).toBe("");
  });
});
