import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  createDiscoveryShops,
  type DiscoveryFilters,
  type DiscoveryShop,
  filterDiscoveryShops,
  formatLocation,
  getNeighborhoods,
  getTypes,
  type MapBounds,
  mapLocations,
} from "../discovery";
import { MapView } from "../map-view";
import {
  loadPublicShops,
  type PublicHomeData,
} from "../public-data/public-home";

export const Route = createFileRoute("/")({
  loader: () => loadPublicShops(),
  component: Home,
});

export function Home() {
  return <Directory data={Route.useLoaderData()} />;
}

export function Directory({ data }: { data: PublicHomeData }) {
  const [search, setSearch] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [type, setType] = useState("");
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [limitToMap, setLimitToMap] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const shops = useMemo(
    () => (data.ok ? createDiscoveryShops(data.shops) : []),
    [data],
  );
  const filters: DiscoveryFilters = {
    search,
    neighborhoodId,
    type,
    mapBounds: limitToMap ? mapBounds : null,
  };
  const filteredShops = filterDiscoveryShops(shops, filters);
  const neighborhoods = useMemo(() => getNeighborhoods(shops), [shops]);
  const types = useMemo(() => getTypes(shops), [shops]);
  const locations = useMemo(() => mapLocations(filteredShops), [filteredShops]);

  if (!data.ok) {
    return (
      <main>
        <header className="site-header">
          <h1>CLT Coffee Map</h1>
          <p>Discover local coffee shops without creating an account.</p>
        </header>
        <div className="site-main">
          <p role="status">
            The directory is temporarily unavailable. Please try again later.
          </p>
        </div>
      </main>
    );
  }

  if (data.shops.length === 0) {
    return (
      <main>
        <header className="site-header">
          <h1>CLT Coffee Map</h1>
          <p>Discover local coffee shops without creating an account.</p>
        </header>
        <div className="site-main">
          <p>No published coffee shops are available yet.</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="site-header">
        <h1>CLT Coffee Map</h1>
        <p>Discover local coffee shops without creating an account.</p>
      </header>
      <div className="site-main">
        <section aria-labelledby="filters-heading">
          <h2 id="filters-heading">Find a coffee shop</h2>
          <div className="directory-toolbar">
            <label>
              Search
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Shop or neighborhood"
              />
            </label>
            <label>
              Neighborhood
              <select
                value={neighborhoodId}
                onChange={(event) => setNeighborhoodId(event.target.value)}
              >
                <option value="">All neighborhoods</option>
                {neighborhoods.map((neighborhood) => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="">All types</option>
                {types.map((locationType) => (
                  <option key={locationType} value={locationType}>
                    {locationType}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <input
              type="checkbox"
              checked={limitToMap}
              onChange={(event) => setLimitToMap(event.target.checked)}
            />{" "}
            Limit results to the visible map area
          </label>
        </section>

        <div className="mobile-view-toggle">
          <button
            type="button"
            aria-pressed={mobileView === "list"}
            onClick={() => setMobileView("list")}
          >
            List
          </button>
          <button
            type="button"
            aria-pressed={mobileView === "map"}
            onClick={() => setMobileView("map")}
          >
            Map
          </button>
        </div>

        <section
          className="discovery-layout"
          data-mobile-view={mobileView}
          aria-label="Coffee shop discovery"
        >
          <div className="discovery-list">
            <h2 id="directory-heading">Coffee shops</h2>
            <p>
              {filteredShops.length}{" "}
              {filteredShops.length === 1 ? "shop" : "shops"} found
            </p>
            {filteredShops.length === 0 ? (
              <p role="status">No shops match these filters.</p>
            ) : (
              <ul>
                {filteredShops.map((shop) => (
                  <ShopCard
                    key={shop.id}
                    shop={shop}
                    selected={selectedShopId === shop.id}
                    onSelect={() => setSelectedShopId(shop.id)}
                  />
                ))}
              </ul>
            )}
          </div>
          <div className="discovery-map-panel">
            <div className="map-panel-heading">
              <h2>Map</h2>
              <span>{locations.length} mapped locations</span>
            </div>
            {locations.length === 0 ? (
              <div className="map-fallback">
                <p>
                  No filtered shops have fixed coordinates. Mobile coffee
                  businesses remain available in the list.
                </p>
              </div>
            ) : (
              <MapView
                locations={locations}
                selectedShopId={selectedShopId}
                onSelectShop={setSelectedShopId}
                onBoundsChange={setMapBounds}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ShopCard({
  shop,
  selected,
  onSelect,
}: {
  readonly shop: DiscoveryShop;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <li
      className={`shop-card${selected ? " selected" : ""}`}
      onMouseEnter={onSelect}
    >
      <h3>
        <Link to="/shops/$shopId" params={{ shopId: shop.id }}>
          {shop.name}
        </Link>
      </h3>
      <p>
        ({shop.locations.length}{" "}
        {shop.locations.length === 1 ? "location" : "locations"})
      </p>
      {shop.locations.map((location) => (
        <p key={location.id}>
          {[location.type, formatLocation(location)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ))}
    </li>
  );
}
