import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { DiscoveryLocation, MapBounds } from "./discovery";
import { publicMapConfig } from "./public-map-config";

interface MapViewProps {
  readonly locations: readonly DiscoveryLocation[];
  readonly selectedShopId: string | null;
  readonly onSelectShop: (shopId: string) => void;
  readonly onBoundsChange: (bounds: MapBounds) => void;
}

export function MapView({
  locations,
  selectedShopId,
  onSelectShop,
  onBoundsChange,
}: MapViewProps) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const markers = useRef<import("leaflet").CircleMarker[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void import("leaflet").then((leaflet) => {
      if (!active || element.current === null || map.current !== null) {
        return;
      }
      const instance = leaflet.map(element.current, {
        center: [35.2271, -80.8431],
        zoom: 11,
        zoomControl: true,
      });
      leaflet
        .tileLayer(publicMapConfig.tileUrl, {
          attribution: publicMapConfig.attribution,
          maxZoom: 20,
        })
        .addTo(instance);
      instance.on("moveend", () => {
        const bounds = instance.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      });
      map.current = instance;
      setReady(true);
      onBoundsChange({
        north: instance.getBounds().getNorth(),
        south: instance.getBounds().getSouth(),
        east: instance.getBounds().getEast(),
        west: instance.getBounds().getWest(),
      });
    });
    return () => {
      active = false;
      map.current?.remove();
      map.current = null;
      markers.current = [];
      setReady(false);
    };
  }, [onBoundsChange]);

  useEffect(() => {
    let active = true;
    if (!ready || map.current === null) {
      return;
    }
    void import("leaflet").then((leaflet) => {
      if (active && map.current !== null) {
        updateMarkers(
          leaflet,
          map.current,
          locations,
          selectedShopId,
          onSelectShop,
          markers,
        );
      }
    });
    return () => {
      active = false;
    };
  }, [locations, onSelectShop, ready, selectedShopId]);

  return (
    <div
      ref={element}
      className="map-view"
      aria-label="Map of coffee shop locations"
      role="application"
    />
  );
}

function updateMarkers(
  leaflet: typeof import("leaflet"),
  map: import("leaflet").Map,
  locations: readonly DiscoveryLocation[],
  selectedShopId: string | null,
  onSelectShop: (shopId: string) => void,
  markerStore: { current: import("leaflet").CircleMarker[] },
) {
  for (const marker of markerStore.current) {
    marker.remove();
  }
  markerStore.current = locations.map((location) => {
    const marker = leaflet
      .circleMarker(location.coordinates as [number, number], {
        radius: location.shopId === selectedShopId ? 10 : 7,
        color: "#5b351f",
        fillColor: location.shopId === selectedShopId ? "#f4b942" : "#c96f3b",
        fillOpacity: 0.9,
        weight: 2,
      })
      .bindTooltip(location.shopName, { direction: "top" })
      .on("click", () => onSelectShop(location.shopId));
    marker.addTo(map);
    return marker;
  });
}
