# 0004: Use Leaflet for the discovery map

## Status

Accepted on 2026-11-09. Related work: [#51](https://github.com/broffis/clt-coffee-map/issues/51).

Follow-up: [ADR 0005](0005-stadia-map-tiles.md) selects Stadia Maps for the
initial tile provider. The open-provider discussion below records the context
before that selection; the Leaflet decision remains accepted.

## Context

The Charlotte-first directory needs a map with shop markers, shop details,
and filtering consistent with the list. Branding and some map styling are
desirable, but extensive background-map customization and complex boundary
layers are not currently expected.

The directory must remain useful when map JavaScript or tiles are slow or
unavailable. Curated shop records and coordinates belong in Atlas, separate
from the map presentation and provider.

## Decision

Use Leaflet as the MVP map-rendering library. Load the interactive map
separately from useful server-rendered shop content and retain the list-based
discovery alternative.

Plan for hosted background tiles rather than generating and hosting our own.
Raster tiles are an appropriate starting point for the anticipated styling
needs; the tile provider and specific style remain undecided. Leaflet is not
itself a tile service or geocoding service.

Keep shop data, stable IDs, coordinates, and region relationships independent
of Leaflet and tile-provider APIs. Display markers from our curated data;
changing the background provider must not require rebuilding the directory.

Preserve the ability to add neighborhood polygon overlays. Including colored
neighborhood boundaries is deferred; neighborhood filtering remains in the MVP.
This does not remove existing roadmap neighborhood filtering requirements.

## Alternatives

### MapLibre GL JS with vector tiles

Offers GPU rendering and finer control over background features and styles.
It is a viable alternative for larger, more complex geographic layers or
requirements to change individual road, park, building, or label styles.
Its WebGL requirement and startup/rendering considerations are not currently
justified by the expected map complexity.

### Integrated commercial map platform

Platforms such as Mapbox or Google Maps provide integrated mapping and
additional location services. Provider-specific APIs, pricing, and terms
would need evaluation. Prefer Leaflet with separately selected tile services
for the current requirements.

## Discussion notes

### Tiles and provider responsibilities

Tiles are small geographic sections loaded as a visitor pans and zooms.
Raster tiles are pre-rendered images: the provider applies a style and draws
streets, parks, buildings, and labels. Vector tiles package geographic shapes
and attributes so a renderer can draw them using a style in the browser.

Hosted providers may offer raster tiles, vector tiles, or both, along with
ready-made styles and sometimes style editors. They generate and serve the
background tiles; our app connects the selected service to Leaflet and adds
our shop layer. OpenStreetMap data is distinct from hosted tile services:
do not assume its public tile servers provide unrestricted production hosting.

### Styling and neighborhoods

Leaflet supports custom shop markers, icons, selected states, popups, controls,
and polygon overlays, alongside a branded surrounding interface. With raster
tiles, individual background roads, labels, and buildings are already painted
into images. Choose a provider's suitable style rather than expecting to
recolor or hide those features independently in the browser.

MapLibre with vector tiles provides finer background styling. This difference
does not prevent Leaflet from drawing our own colored neighborhood overlays:
for example, translucent blue for Uptown and green for Plaza Midwood.
Both libraries can support neighborhood highlights and selection/filter links.

If neighborhood visualization is included, use suitable boundary data, commonly
GeoJSON, with verified coverage and licensing. Define a fallback where agreed
boundaries are unavailable rather than inventing borders. Detailed boundaries,
colors, and interactions remain undecided.

### Performance and marker counts

Leaflet has no fixed marker-count cap. Standard markers are HTML elements;
performance depends on visible marker count, icon complexity, other layers,
device capability, and browser behavior. Hundreds of markers are commonly
practical, while thousands displayed simultaneously may become sluggish.
These are qualitative expectations, not measured limits or guarantees.

Leaflet generally offers a lighter startup path for simple maps without
requiring WebGL. MapLibre's GPU rendering can benefit large or complex
geographic layers, but neither library is universally faster. Tile-provider
latency, network conditions, caching, and map style also affect loading.
No application benchmarks have been run.

Test the real dataset on mobile before adding optimization. If needed, assess
marker clustering, rendering markers near the viewport, or canvas-rendered
points instead of individual HTML markers. Keep intended list/map filtering
consistent; rendering optimizations must not silently change result semantics.
Simple optional neighborhood overlays alone do not require switching renderers.

### Hosted tile provider shortlist

The project is initially personal. Evaluate MapTiler, Stadia Maps, and
Geoapify rather than excluding non-commercial free tiers. No provider or
style has been selected. Revisit eligibility if the project's use changes.

Published pricing reviewed on 2026-11-09:

| Provider | Free allowance | Published paid entry point | Considerations |
| --- | --- | --- | --- |
| MapTiler | 100,000 API requests/month; personal/non-commercial use | Flex: $30/month plus extra usage | Leaflet tile requests are distinct from MapTiler SDK sessions; 512px rendered tiles count as four requests. Free maps require the MapTiler logo. |
| Stadia Maps | 200,000 credits/month; non-commercial use | Starter: $20/month | Standard raster tiles cost one credit each. Free plan has no additional usage; confirm applicable attribution and style availability. |
| Geoapify | 3,000 credits/day; pricing FAQ permits commercial production use with attribution | API 10: $59/month | Tiles cost 0.25 credits each, giving up to 12,000 tiles/day if no other APIs consume credits. Daily allowance is not a pooled monthly quota. |

These are request allowances, not visitor counts. Initial view, panning,
zooming, viewport size, high-density tiles, and caching affect requests per
visit. Evaluate the intended Leaflet integration, not just headline quotas.
Geoapify's older terms mention production limitations and possible overage
charges; confirm applicable terms rather than assuming an unconditional
free-production guarantee from the pricing FAQ.

Compare candidate styles at the same Charlotte locations and zoom levels.
Assess street-label readability, visual clutter around our markers, mobile
legibility, attribution/logo placement, and request usage. Provider galleries
are starting points, not proof of measured application performance.

Sources and style previews:

- [MapTiler pricing](https://www.maptiler.com/cloud/pricing/)
- [MapTiler styles](https://www.maptiler.com/maps/)
- [Stadia Maps pricing](https://stadiamaps.com/pricing/)
- [Stadia Maps explorer](https://stadiamaps.com/explore-the-map/)
- [Geoapify pricing](https://www.geoapify.com/pricing/)
- [Geoapify credit accounting](https://www.geoapify.com/pricing-details/)
- [Geoapify terms](https://www.geoapify.com/terms-and-conditions/)
- [Geoapify tiles and styles](https://www.geoapify.com/map-tiles/)

## Consequences

- Select a hosted tile provider and style after reviewing current pricing,
  usage limits, attribution, terms, and availability. No service is provisioned
  and no recurring costs are authorized by this decision.
- Consider admin address lookup/geocoding separately from background tiles;
  no geocoding provider or visitor address-search feature is selected here.
- Verify attribution, keyboard interactions, accessible shop details, and the
  list alternative during implementation.
- Keep provider configuration and map presentation separate from curated data.
  Reassess the renderer through a superseding ADR if measured performance or
  styling requirements outgrow this choice.
