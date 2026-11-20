import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MapView } from "../src/map-view";

const leafletMock = vi.hoisted(() => {
  let moveEnd: (() => void) | undefined;
  const bounds = {
    getNorth: () => 36,
    getSouth: () => 35,
    getEast: () => -80,
    getWest: () => -81,
  };
  const map = {
    on: vi.fn((_event: string, callback: () => void) => {
      moveEnd = callback;
      return map;
    }),
    getBounds: vi.fn(() => bounds),
    remove: vi.fn(),
  };
  const markers: {
    remove: ReturnType<typeof vi.fn>;
    bindTooltip: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    addTo: ReturnType<typeof vi.fn>;
  }[] = [];
  return {
    map,
    markers,
    emitMoveEnd: () => moveEnd?.(),
    mapFactory: vi.fn(() => map),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    circleMarker: vi.fn(() => {
      const marker = {
        remove: vi.fn(),
        bindTooltip: vi.fn(() => marker),
        on: vi.fn(() => marker),
        addTo: vi.fn(() => marker),
      };
      markers.push(marker);
      return marker;
    }),
  };
});

vi.mock("leaflet", () => ({
  map: leafletMock.mapFactory,
  tileLayer: leafletMock.tileLayer,
  circleMarker: leafletMock.circleMarker,
}));

describe("MapView", () => {
  beforeEach(() => {
    leafletMock.mapFactory.mockClear();
    leafletMock.tileLayer.mockClear();
    leafletMock.circleMarker.mockClear();
    leafletMock.map.remove.mockClear();
    leafletMock.markers.length = 0;
  });

  it("initializes the map, reports bounds, and refreshes markers", async () => {
    const onBoundsChange = vi.fn();
    const onSelectShop = vi.fn();
    const { rerender, unmount } = render(
      <MapView
        locations={[
          {
            id: "location-1",
            shopId: "shop-1",
            shopName: "Coffee shop",
            neighborhoodId: null,
            type: "cafe",
            coordinates: [35.2271, -80.8431],
            details: {},
          },
        ]}
        selectedShopId={null}
        onSelectShop={onSelectShop}
        onBoundsChange={onBoundsChange}
      />,
    );

    await waitFor(() => expect(leafletMock.circleMarker).toHaveBeenCalled());
    expect(leafletMock.mapFactory).toHaveBeenCalled();
    expect(leafletMock.tileLayer).toHaveBeenCalled();
    expect(onBoundsChange).toHaveBeenCalled();
    expect(leafletMock.markers[0]?.bindTooltip).toHaveBeenCalledWith(
      "Coffee shop",
      { direction: "top" },
    );

    leafletMock.emitMoveEnd();
    expect(onBoundsChange).toHaveBeenCalledTimes(2);

    rerender(
      <MapView
        locations={[
          {
            id: "location-1",
            shopId: "shop-1",
            shopName: "Coffee shop",
            neighborhoodId: null,
            type: "cafe",
            coordinates: [35.2271, -80.8431],
            details: {},
          },
        ]}
        selectedShopId="shop-1"
        onSelectShop={onSelectShop}
        onBoundsChange={onBoundsChange}
      />,
    );
    await waitFor(() =>
      expect(leafletMock.markers[0]?.remove).toHaveBeenCalled(),
    );
    unmount();
    expect(leafletMock.map.remove).toHaveBeenCalled();
  });
});
