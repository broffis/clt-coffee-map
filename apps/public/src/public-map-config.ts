const defaultTileUrl =
  "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png";
const defaultAttribution =
  '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export const publicMapConfig = {
  tileUrl: import.meta.env.VITE_PUBLIC_MAP_TILE_URL ?? defaultTileUrl,
  attribution:
    import.meta.env.VITE_PUBLIC_MAP_ATTRIBUTION ?? defaultAttribution,
} as const;
