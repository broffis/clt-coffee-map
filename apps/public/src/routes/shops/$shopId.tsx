import { createFileRoute, Link } from "@tanstack/react-router";
import { formatLocation } from "../../discovery";
import {
  loadPublicShop,
  type PublicDetailData,
} from "../../public-data/public-detail";
import type { PublicJsonObject } from "../../public-data/public-reader";
import { publicPhotoBaseUrl, readPublicPhotos } from "../../public-photos";

export const Route = createFileRoute("/shops/$shopId")({
  loader: ({ params }) => loadPublicShop({ data: { shopId: params.shopId } }),
  component: ShopDetail,
});

export function ShopDetail() {
  return <ShopDetailContent data={Route.useLoaderData()} />;
}

export function ShopDetailContent({ data }: { data: PublicDetailData }) {
  if (!data.ok) {
    return (
      <main>
        <p>
          <Link to="/">Back to coffee shops</Link>
        </p>
        <h1>
          {data.error === "not-found"
            ? "Shop not found"
            : "Directory unavailable"}
        </h1>
        <p role="status">
          {data.error === "not-found"
            ? "This coffee shop is not published."
            : "The directory is temporarily unavailable. Please try again later."}
        </p>
      </main>
    );
  }

  return (
    <main>
      <p>
        <Link to="/">Back to coffee shops</Link>
      </p>
      <h1>{shopName(data.shop.details)}</h1>
      {typeof data.shop.details.description === "string" ? (
        <p>{data.shop.details.description}</p>
      ) : null}
      {readPublicPhotos(data.shop.details, publicPhotoBaseUrl()).map(
        (photo) => (
          <img
            key={photo.id}
            src={photo.src}
            srcSet={photo.srcSet}
            sizes="(min-width: 960px) 960px, 100vw"
            width={photo.width}
            height={photo.height}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
          />
        ),
      )}
      <p>
        {data.shop.locations.length}{" "}
        {data.shop.locations.length === 1 ? "location" : "locations"}
      </p>
      <ul>
        {data.shop.locations.map((location) => (
          <li key={location.id}>
            <span>
              {locationType(location.details)}{" "}
              {formatLocation({
                id: location.id,
                shopId: location.shopId,
                shopName: shopName(data.shop.details),
                neighborhoodId:
                  typeof location.details.neighborhoodId === "string"
                    ? location.details.neighborhoodId
                    : null,
                type: locationType(location.details),
                coordinates: null,
                details: location.details,
              })}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}

function shopName(details: PublicJsonObject): string {
  return typeof details.name === "string" && details.name.trim() !== ""
    ? details.name
    : "Unnamed coffee shop";
}

function locationType(details: PublicJsonObject): string {
  return typeof details.type === "string" ? details.type : "Coffee shop";
}
