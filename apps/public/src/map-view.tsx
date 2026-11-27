import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { MapBounds, MapLocation } from "./discovery";
import { fallbackImage, showFallbackImage } from "./fallback-image";
import { publicMapConfig } from "./public-map-config";

interface MapViewProps {
  readonly locations: readonly MapLocation[];
  readonly selectedShopId: string | null;
  readonly onSelectShop: (shopId: string) => void;
  readonly onBoundsChange: (bounds: MapBounds) => void;
}

interface StoredMarker {
  readonly marker: import("leaflet").CircleMarker;
  readonly location: MapLocation;
}

export function MapView({
  locations,
  selectedShopId,
  onSelectShop,
  onBoundsChange,
}: MapViewProps) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const markers = useRef<StoredMarker[]>([]);
  const selection = useRef(selectedShopId);
  selection.current = selectedShopId;
  const selectShop = useRef(onSelectShop);
  selectShop.current = onSelectShop;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let resizeObserver: ResizeObserver | undefined;
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
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => instance.invalidateSize());
        resizeObserver.observe(element.current);
      }
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
      resizeObserver?.disconnect();
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
          selection.current,
          selectShop,
          markers,
        );
      }
    });
    return () => {
      active = false;
    };
  }, [locations, ready]);

  useEffect(() => {
    for (const { marker, location } of markers.current) {
      marker.setRadius(location.shopId === selectedShopId ? 10 : 7);
      marker.setStyle({
        fillColor: location.shopId === selectedShopId ? "#f4b942" : "#c96f3b",
      });
    }
  }, [selectedShopId]);

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
  locations: readonly MapLocation[],
  selectedShopId: string | null,
  onSelectShop: { current: (shopId: string) => void },
  markerStore: { current: StoredMarker[] },
) {
  const existing = new Map(
    markerStore.current.map((entry) => [entry.location.id, entry]),
  );
  markerStore.current = locations.map((location) => {
    const previous = existing.get(location.id);
    existing.delete(location.id);
    if (previous !== undefined) {
      if (sameMarkerContent(previous.location, location)) {
        return previous;
      }
      previous.marker.remove();
    }
    const tooltip = document.createElement("span");
    tooltip.textContent = location.shopName;
    const marker = leaflet
      .circleMarker([...location.coordinates], {
        radius: location.shopId === selectedShopId ? 10 : 7,
        color: "#5b351f",
        fillColor: location.shopId === selectedShopId ? "#f4b942" : "#c96f3b",
        fillOpacity: 0.9,
        weight: 2,
      })
      .bindTooltip(tooltip, { direction: "top" })
      .bindPopup(createPopup(location))
      .on("click", () => onSelectShop.current(location.shopId));
    marker.addTo(map);
    const element = marker.getElement();
    if (element !== undefined) {
      element.setAttribute("tabindex", "0");
      element.setAttribute("role", "button");
      element.setAttribute("aria-label", location.shopName);
      element.addEventListener("keydown", (event) => {
        if (
          event instanceof KeyboardEvent &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          marker.openPopup();
          onSelectShop.current(location.shopId);
        }
      });
    }
    return { marker, location };
  });
  for (const { marker } of existing.values()) {
    marker.remove();
  }
}

function sameMarkerContent(left: MapLocation, right: MapLocation): boolean {
  return (
    left.shopId === right.shopId &&
    left.shopName === right.shopName &&
    left.coordinates[0] === right.coordinates[0] &&
    left.coordinates[1] === right.coordinates[1] &&
    left.photo?.src === right.photo?.src &&
    left.photo?.srcSet === right.photo?.srcSet &&
    left.photo?.width === right.photo?.width &&
    left.photo?.height === right.photo?.height &&
    left.photo?.alt === right.photo?.alt
  );
}

function createPopup(location: MapLocation): HTMLElement {
  const popup = document.createElement("div");
  popup.className = "shop-map-popup";
  const image = document.createElement("img");
  if (location.photo === null) {
    image.src = fallbackImage;
    image.alt = "";
    image.width = 1080;
    image.height = 1080;
    image.className = "shop-placeholder";
  } else {
    image.addEventListener("error", () => showFallbackImage(image), {
      once: true,
    });
    image.src = location.photo.src;
    image.srcset = location.photo.srcSet;
    image.sizes = "200px";
    image.width = location.photo.width;
    image.height = location.photo.height;
    image.alt = location.photo.alt;
  }
  image.loading = "lazy";
  image.decoding = "async";
  popup.append(image);
  const link = document.createElement("a");
  link.href = `/shops/${encodeURIComponent(location.shopId)}`;
  link.textContent = location.shopName;
  popup.append(link);
  return popup;
}
