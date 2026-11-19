import { createFileRoute, Link } from "@tanstack/react-router";
import {
  loadPublicShops,
  type PublicHomeData,
} from "../public-data/public-home";
import type { PublicJsonObject } from "../public-data/public-reader";

export const Route = createFileRoute("/")({
  loader: () => loadPublicShops(),
  component: Home,
});

export function Home() {
  return <Directory data={Route.useLoaderData()} />;
}

export function Directory({ data }: { data: PublicHomeData }) {
  return (
    <main>
      <h1>CLT Coffee Map</h1>
      <p>Discover local coffee shops without creating an account.</p>
      {data.ok ? (
        data.shops.length === 0 ? (
          <p>No published coffee shops are available yet.</p>
        ) : (
          <section aria-labelledby="directory-heading">
            <h2 id="directory-heading">Coffee shops</h2>
            <ul>
              {data.shops.map((shop) => (
                <li key={shop.id}>
                  <Link to="/shops/$shopId" params={{ shopId: shop.id }}>
                    {shopName(shop.details)}
                  </Link>
                  <span>
                    {" "}
                    ({shop.locations.length}{" "}
                    {shop.locations.length === 1 ? "location" : "locations"})
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )
      ) : (
        <p role="status">
          The directory is temporarily unavailable. Please try again later.
        </p>
      )}
    </main>
  );
}

function shopName(details: PublicJsonObject): string {
  return typeof details.name === "string" && details.name.trim() !== ""
    ? details.name
    : "Unnamed coffee shop";
}
