# 0007: Curate neighborhood labels without importing boundaries

## Status

Accepted on 2026-11-09. Related work: [#51](https://github.com/broffis/clt-coffee-map/issues/51).

## Context

Neighborhood filtering remains part of MVP, while colored boundary overlays
are deferred by [ADR 0004](0004-leaflet-map-rendering.md). Discovery needs
recognizable labels such as Uptown and Plaza Midwood, not necessarily
statistical areas or subdivision names.

The original roadmap preferred an official neighborhood dataset. Research
found useful references but did not establish a suitable, licensed dataset
for direct import:

- Mecklenburg County Neighborhood Profile Areas organize Quality of Life
  data using one or more Census block groups. They are not automatically
  equivalent to visitor-facing neighborhood labels.
- County subdivision metadata explicitly warns that subdivisions are not
  neighborhood boundaries and notes coverage gaps near uptown.
- Charlotte's Neighborhood Directory Public provides names and polygons for
  approved neighborhood organizations. Its coverage for discovery has not
  been validated, and the ArcGIS item's license field is empty. Public API
  access is not proof of permission to reuse or redistribute its data.

## Decision

Use an administrator-curated set of neighborhood discovery labels for MVP.
Give labels stable IDs and explicit region/city relationships, and have
administrators review assignments to shop locations. Use sources and
last-verified metadata to support maintenance and corrections.

Use town or community labels for nearby places when neighborhood labels are
not useful. Preserve the actual city/region relationship; a discovery label
must not silently change a location's municipality. Do not invent a
neighborhood assignment when it cannot be verified.

Keep the map and list on the same curated assignments. Do not derive MVP
assignments automatically from census areas, subdivisions, a map provider,
or an unverified polygon dataset. These labels support discovery, not a
claim of official or legally authoritative boundaries.

Defer selecting and importing a boundary dataset. Keep future geometry
separate from label identity and shop data so overlays can be added later
without changing stable IDs. Do not implement boundary editing or automated
geographic assignment now.

### Sources and licensing

Use official and local primary references to help administrators verify
individual labels and assignments, recording provenance and verification
dates. This decision does not authorize bulk copying a source database,
descriptions, contact information, or geometry.

Before any dataset import or redistribution, verify the exact source's
coverage, license, attribution, modification/redistribution rights, commercial
restrictions, and update process. Resolve missing or conflicting terms with
the publisher rather than assuming an open-data portal grants unrestricted
reuse. Some city items list non-commercial/share-alike terms; those cannot
be generalized to other items.

If a suitable dataset is adopted later, document its version, permitted uses,
attribution, update process, and relationship to curated labels. Import only
needed fields; neighborhood-organization contact details are not shop data.

## Alternatives

### Import an official dataset now

Could support geographic assignment and future overlays, but suitability,
coverage, and reuse permissions remain unverified. It adds unnecessary work
while MVP needs labels rather than boundary visualization.

### Use only city or town names

Simpler, but removes the neighborhood filtering already included in MVP.
Retain town/community labeling where it is useful without dropping Charlotte
neighborhood discovery.

## Consequences

- Administrators own label consistency, assignment review, and corrections;
  no automatic source synchronization or comprehensive boundary coverage is
  promised.
- Official datasets remain reference candidates, not selected dependencies.
  Geometry adoption and its license review are deferred, not completed.
- Test region-linked assignments and consistent filtering during
  implementation. No labels, shop assignments, or external dataset have been
  imported by this decision.

## References

- [County Neighborhood Profile Areas](https://www.arcgis.com/home/item.html?id=cc860e3d177246ddbb0a4ec434c87b6a)
- [County subdivisions and coverage caveats](https://www.arcgis.com/home/item.html?id=f6ab65d79eb44378afc3011e23727027)
- [City Neighborhood Directory Public item](https://www.arcgis.com/home/item.html?id=b7c8ee66b9fd4a8ea90afbe928d3a7bb)
- [City directory layer metadata](https://gis.charlottenc.gov/arcgis/rest/services/HNS/NeighborhoodDirectoryPublic/MapServer/0)
