# 0005: Use Stadia Maps tiles with a replaceable provider

## Status

Accepted on 2026-11-09. Related work: [#51](https://github.com/broffis/clt-coffee-map/issues/51).

Completes the initial tile-provider selection left open in
[ADR 0004](0004-leaflet-map-rendering.md); the Leaflet decision is unchanged.

## Context

The project is initially personal and prefers free tiers where practical.
The map should be simple to read, show streets and street labels at close
zoom, and let our curated shop markers stand out. Extensive background-map
customization is not required.

MapTiler, Stadia Maps, and Geoapify were compared in ADR 0004. Geoapify's
published $59/month paid entry point raises cost concerns. Stadia currently
offers a non-commercial free allowance and a lower published paid entry
point, but provider suitability may change with traffic, pricing, or use.

## Decision

Use Stadia Maps as the initial hosted raster tile provider for Leaflet.
Evaluate its free plan for the personal project, subject to confirming
eligibility, attribution, and usage limits before deployment.

Keep the provider replaceable. Configure the tile URL/style, authentication,
attribution, tile size, and zoom settings at the map boundary rather than
embedding Stadia assumptions in shop records or discovery logic. Switching
providers must not require migrating Atlas shop data or changing list filters.
Do not build an elaborate multi-provider framework or automatic failover now.

Choose the specific style during implementation after checking Charlotte
streets and labels at close zoom, marker contrast, and mobile readability.
Provider galleries alone do not validate the actual application experience.

Reevaluate Stadia if free-plan eligibility changes, quotas become restrictive,
the paid plan is too expensive, or coverage, readability, reliability, or
service terms no longer meet requirements. Compare alternatives before
committing to a paid upgrade; recurring costs require discussion.

This decision does not provision an account, enable billing, choose a
geocoding service, or authorize paid services.

## Alternatives

### MapTiler

Remains a replacement candidate with hosted raster maps and a
personal/non-commercial free tier. Its published paid entry point is
currently $30/month; Leaflet tile-request accounting must be evaluated
separately from MapTiler SDK map-session allowances.

### Geoapify

Remains a replacement candidate with raster tiles and daily free credits.
The current pricing FAQ allows commercial production use with attribution,
but older terms need clarification. Its published $59/month paid entry point
is less attractive for this project's budget.

## Consequences

- Pricing reviewed on 2026-11-09 lists 200,000 free credits/month for
  non-commercial use and one credit per standard raster tile. Starter lists
  $20/month. Recheck current plans, rate limits, extra usage, and eligibility
  before deployment; tile credits are not visitor counts.
- Display the attribution required by the chosen style and its data sources.
  Configure supported domain/authentication restrictions during integration.
- Exact styles, provider-specific configuration, and tile-cache permissions
  do not automatically transfer to another provider. Review the replacement's
  terms, attribution, tile geometry/zoom behavior, and visual result.
- Keep any future neighborhood overlays separately sourced and licensed.
  Neighborhood filtering remains in MVP; colored boundaries remain deferred.
- Test missing/failed tiles without breaking server-rendered shop content or
  list discovery. Replacing the provider is a deliberate configuration change,
  not an unreviewed fallback that bypasses service limits.
- Record a future provider replacement and its rationale in a superseding ADR.

## References

- [Stadia Maps pricing](https://stadiamaps.com/pricing/)
- [Stadia Maps style explorer](https://stadiamaps.com/explore-the-map/)
- [Renderer decision and provider comparison](0004-leaflet-map-rendering.md)
