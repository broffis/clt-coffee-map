import { act, fireEvent, render, waitFor } from "@testing-library/react";
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
    bindPopup: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    addTo: ReturnType<typeof vi.fn>;
    setRadius: ReturnType<typeof vi.fn>;
    setStyle: ReturnType<typeof vi.fn>;
    getElement: () => HTMLElement;
    openPopup: ReturnType<typeof vi.fn>;
  }[] = [];
  return {
    map,
    markers,
    emitMoveEnd: () => moveEnd?.(),
    mapFactory: vi.fn(() => map),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    circleMarker: vi.fn(() => {
      const element = document.createElement("button");
      const marker = {
        remove: vi.fn(),
        bindTooltip: vi.fn(() => marker),
        bindPopup: vi.fn(() => marker),
        on: vi.fn(() => marker),
        addTo: vi.fn(() => marker),
        setRadius: vi.fn(() => marker),
        setStyle: vi.fn(() => marker),
        getElement: vi.fn(() => element),
        openPopup: vi.fn(() => marker),
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
            coordinates: [35.3, -80.8431],
            details: {},
            photo: null,
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
    const tooltip = leafletMock.markers[0]?.bindTooltip.mock.calls[0]?.[0];
    expect(tooltip).toHaveTextContent("Coffee shop");

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
            photo: null,
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

  it("shows a responsive photo in the popup without closing it on selection", async () => {
    const locations = [
      {
        id: "location-1",
        shopId: "shop-1",
        shopName: "<Coffee shop>",
        neighborhoodId: null,
        type: "cafe",
        coordinates: [35.2271, -80.8431] as const,
        details: {},
        photo: {
          id: "photo-1",
          alt: "Coffee counter",
          src: "https://photos.example.test/photos/photo-1/960.webp",
          srcSet:
            "https://photos.example.test/photos/photo-1/480.webp 480w, https://photos.example.test/photos/photo-1/960.webp 960w",
          width: 960,
          height: 640,
        },
      },
    ];
    const onSelectShop = vi.fn();
    const onBoundsChange = vi.fn();
    const { rerender } = render(
      <MapView
        locations={locations}
        selectedShopId={null}
        onSelectShop={onSelectShop}
        onBoundsChange={onBoundsChange}
      />,
    );
    await waitFor(() =>
      expect(leafletMock.markers[0]?.bindPopup).toHaveBeenCalled(),
    );
    const marker = leafletMock.markers[0];
    const popup = marker?.bindPopup.mock.calls[0]?.[0] as HTMLElement;
    expect(popup.textContent).toContain("<Coffee shop>");
    expect(popup.querySelector("coffee shop")).toBeNull();
    const image = popup.querySelector("img");
    expect(image).toHaveAttribute("alt", "Coffee counter");
    expect(image).toHaveAttribute("srcset", locations[0]?.photo.srcSet);

    if (marker === undefined) {
      throw new Error("Expected a map marker.");
    }
    const element = marker.getElement();
    expect(element).toHaveAttribute("aria-label", "<Coffee shop>");
    fireEvent.keyDown(element, { key: "Enter" });
    expect(marker?.openPopup).toHaveBeenCalled();
    expect(onSelectShop).toHaveBeenCalledWith("shop-1");

    rerender(
      <MapView
        locations={locations}
        selectedShopId="shop-1"
        onSelectShop={onSelectShop}
        onBoundsChange={onBoundsChange}
      />,
    );
    expect(marker.setRadius).toHaveBeenCalledWith(10);
    expect(marker.remove).not.toHaveBeenCalled();

    await act(async () => {
      rerender(
        <MapView
          locations={locations.map((location) => ({ ...location }))}
          selectedShopId="shop-1"
          onSelectShop={onSelectShop}
          onBoundsChange={onBoundsChange}
        />,
      );
    });
    expect(marker.remove).not.toHaveBeenCalled();
    expect(leafletMock.circleMarker).toHaveBeenCalledTimes(1);
  });

  it("shows the shop name when no photo is available", async () => {
    render(
      <MapView
        locations={[
          {
            id: "location-1",
            shopId: "shop-1",
            shopName: "Coffee shop",
            neighborhoodId: null,
            type: "cafe",
            coordinates: [35, -80],
            details: {},
            photo: null,
          },
        ]}
        selectedShopId={null}
        onSelectShop={vi.fn()}
        onBoundsChange={vi.fn()}
      />,
    );
    await waitFor(() =>
      expect(leafletMock.markers[0]?.bindPopup).toHaveBeenCalled(),
    );
    const popup = leafletMock.markers[0]?.bindPopup.mock
      .calls[0]?.[0] as HTMLElement;
    expect(popup.textContent).toContain("Coffee shop");
    expect(popup.querySelector("img")).toBeNull();
  });

  it("reconciles changed and removed locations and uses the latest selection callback", async () => {
    const location = {
      id: "location-1",
      shopId: "shop-1",
      shopName: "Coffee shop",
      neighborhoodId: null,
      type: "cafe",
      coordinates: [35, -80] as const,
      details: {},
      photo: null,
    };
    const onBoundsChange = vi.fn();
    const firstSelect = vi.fn();
    const nextSelect = vi.fn();
    const { rerender } = render(
      <MapView
        locations={[location]}
        selectedShopId={null}
        onSelectShop={firstSelect}
        onBoundsChange={onBoundsChange}
      />,
    );
    await waitFor(() =>
      expect(leafletMock.circleMarker).toHaveBeenCalledTimes(1),
    );
    const firstMarker = leafletMock.markers[0];
    if (firstMarker === undefined) throw new Error("Expected a map marker.");

    await act(async () => {
      rerender(
        <MapView
          locations={[{ ...location, coordinates: [35, -80] }]}
          selectedShopId={null}
          onSelectShop={nextSelect}
          onBoundsChange={onBoundsChange}
        />,
      );
    });
    expect(firstMarker.remove).not.toHaveBeenCalled();
    fireEvent.keyDown(firstMarker.getElement(), { key: " " });
    expect(nextSelect).toHaveBeenCalledWith("shop-1");
    expect(firstSelect).not.toHaveBeenCalled();

    await act(async () => {
      rerender(
        <MapView
          locations={[
            {
              ...location,
              photo: {
                id: "photo",
                alt: "Counter",
                src: "https://example.test/1",
                srcSet: "https://example.test/1 1w",
                width: 1,
                height: 1,
              },
            },
          ]}
          selectedShopId={null}
          onSelectShop={nextSelect}
          onBoundsChange={onBoundsChange}
        />,
      );
    });
    expect(firstMarker.remove).toHaveBeenCalledOnce();
    expect(leafletMock.circleMarker).toHaveBeenCalledTimes(2);
    const replacement = leafletMock.markers[1];
    expect(
      replacement?.bindPopup.mock.calls[0]?.[0].querySelector("img"),
    ).toHaveAttribute("alt", "Counter");

    await act(async () => {
      rerender(
        <MapView
          locations={[]}
          selectedShopId={null}
          onSelectShop={nextSelect}
          onBoundsChange={onBoundsChange}
        />,
      );
    });
    expect(replacement?.remove).toHaveBeenCalledOnce();
  });
});
