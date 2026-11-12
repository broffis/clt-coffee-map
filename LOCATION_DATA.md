# Location data evaluation

Research date: 2026-11-12. Overture is the owner's preferred initial candidate
source, subject to the checks below. This is not authorization to import data
or provision a paid service. Pricing, terms, coverage, and fields can change;
recheck them before implementation.

## Goal and fields

Reduce manual entry by discovering initial shop candidates and periodically
checking for changes. Administrators review candidates and changes before
publication; imports must not overwrite curated data automatically.

The preferred initial workflow is to fetch Overture candidates for private
admin review, let an administrator modify the fields, and save to the curated
shop database only after the review is complete. An unfinished review is not
saved as a curated draft. After review, saving creates an unpublished draft;
publishing is a separate explicit action. Overture results are never displayed
directly to visitors.

One possible admin design is a separate private, temporary staging database
holding downloaded Overture data, replaced when a new download runs. This
source-data staging area is distinct from the curated shop database: refreshing
it must not overwrite curated drafts or published shops. Access to it must be
explicitly authorized, and it must not appear in public reads or exports.
Its storage technology, refresh failure handling, concurrent reviews,
retention, costs, and handling of interrupted unsaved edits remain to be decided.
Review completion criteria also remain open.

| Field | Intended source |
| --- | --- |
| Name, address, city, coordinates, business category | Programmatic source where available; review before publication |
| Website and social links | Programmatic source where available; review before publication |
| Regular weekly hours | Possible lead from a provider; verify against a shop-controlled source |
| Roaster supplying the beans | Manually curate and verify |
| Coffee options | Manually curate: espresso, drip, pour-over, cold brew, and milk drinks |
| Non-coffee drinks and food | Separate manually curated fields; food options include baked goods, sandwiches, full menu, breakfast items, and salads |
| Description, menu link, and photo | Curated when available; verify photo reuse rights |
| Neighborhood/community | Administrator-reviewed assignment, not a provider-derived boundary |

Stable internal shop and location IDs, region relationships, publication state,
source references, and verification dates are application metadata, not
requirements on a provider. External IDs support matching but do not replace
our IDs. A shop owns its shared name, while offerings and multiple roasters
belong to each location; unknown offerings are distinct from confirmed absence.
Ownership of other fields remains to be decided.

Regular hours currently follow [ADR 0008](docs/decisions/0008-manually-maintained-opening-hours.md):
verify against a shop-controlled source, record an hours-specific source and
verification date, and review every three months. Unknown hours are not closed
days. Automated hours synchronization would require revisiting that decision.
Mobile businesses without a fixed location remain list-only.

## Comparison

| Candidate | Fields and access | Reuse, cost, and limitations | Assessment |
| --- | --- | --- | --- |
| [OpenStreetMap via Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API) | Query cafe and other tagged features by area. Tags can include address, website, social links, and hours; availability varies. | OSM data is under [ODbL](https://www.openstreetmap.org/copyright): attribution and potentially share-alike for a publicly used derived database. Public Overpass instances are shared, rate-limited services, not guaranteed production backends. | Strong candidate for a reviewed import, subject to quality and license review. |
| [Overture Places](https://docs.overturemaps.org/guides/places/) | Download/query area extracts from cloud-hosted GeoParquet. The [schema](https://docs.overturemaps.org/schema/reference/places/place/) includes names, addresses, point geometry, categories, websites, and social links, but not opening hours. It is a dataset, not a hosted Places search API. | Sources include CDLA Permissive 2.0, Apache 2.0, and CC0 1.0; see the licensing review below. Data is freely available; query, transfer, storage, and hosting can still cost money. Monthly releases can contain duplicates, stale entries, and missing fields. Stationary places only. | Preferred initial candidate source. Local sample results are not directly comparable with the OSM query. |
| [Geoapify Places API](https://apidocs.geoapify.com/docs/places/) | Hosted category and area search with an API key. Field completeness for Charlotte was not tested. | [Pricing](https://www.geoapify.com/pricing/) lists a free tier of 3,000 credits/day and paid plans starting at $59/month. OSM attribution is required; the free tier also requires Geoapify attribution. Confirm permanent storage, public redistribution, and export rights for the exact response and plan before use. | Convenient API candidate, but reuse terms and local coverage are unverified. |
| [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview) | Search and details include core fields and hours, subject to field selection and billing. | [Policies](https://developers.google.com/maps/documentation/places/web-service/policies) restrict storing or extracting Places content and creating derived content; place IDs are exempt, and coordinates have a limited caching exception. [Service terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) also restrict Places content with non-Google maps. Pricing varies by SKU and requested fields. | Not a suitable persistent seed for our portable directory under standard terms. Review any separately negotiated license before reconsidering. |
| [Apify Actors](https://docs.apify.com/actors) | A runner for source-specific scraping and processing, not an independent place-data source. Its [Google Maps scraper](https://apify.com/compass/crawler-google-places) advertises core fields and hours. | The scraper lists pricing from $1.50 per 1,000 places; add-ons and other Actors have different pricing. Apify does not grant rights to the underlying data. | Consider only as infrastructure for an independently approved source; do not treat it as a way around Google restrictions. |

ODbL does not automatically require publishing application code or private
admin and visitor data. The extent of any database-sharing obligation depends
on the specific extraction, combination, and public use. The owner accepts
attribution and applicable share-alike requirements; review the planned
database and export against the license before importing. If Overture and OSM
data are combined, assess the combined database as well. See the
[OSM attribution guidance](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines)
and [ODbL summary](https://opendatacommons.org/licenses/odbl/summary/).

## Overture Places licensing review

The [Places guide](https://docs.overturemaps.org/guides/places/#sources-and-licensing)
states that the Places theme does not include OSM data. Its
[provider attribution page](https://docs.overturemaps.org/attribution/#places)
lists Meta, Microsoft, and several other sources under CDLA Permissive 2.0;
Foursquare under Apache 2.0; and AllThePlaces under CC0 1.0. Other Overture
themes can have different licenses, including ODbL: do not assume the Places
terms apply to addresses, boundaries, or map data.

- [CDLA Permissive 2.0](https://cdla.dev/permissive-2-0/) permits use,
  modification, and sharing. When sharing data, modified or not, make the
  agreement text available with it; it does not impose ODbL-style share-alike.
- [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) permits
  reproduction, modification, and distribution. Distribution requires a
  license copy, notices of modifications, preservation of relevant attribution
  notices, and applicable NOTICE content. Overture identifies Foursquare data
  as transformed and links the [Foursquare NOTICE](https://opensource.foursquare.com/places-notice-txt/);
  retain the applicable notice and record our own changes when distributing it.
- [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) is the
  designation listed for AllThePlaces; review its terms and any applicable
  source notices for the chosen release.

These terms support the proposed reviewed-import workflow in principle:
administrators can edit records and the application can publish them. Overture
alone does not impose an ODbL requirement to share the curated database.
Before distributing public pages, static data, or exports, preserve relevant
provenance and provide applicable license texts and notices alongside the
distribution. The owner also accepts visible attribution. Determine the
appropriate notice location for each output and verify the actual release's
source metadata and notices; a record's source/license field may be absent.
Combining another source, including OSM, requires a separate license review.
This is a technical reading of the published terms, not legal advice.

## Small Charlotte sample

On 2026-11-12, a read-only query sampled the same central-Charlotte bounding
box: south 35.20, west -80.87, north 35.25, east -80.80. This rectangle is not
the Charlotte city boundary and does not represent the entire launch region.
No shop data was imported into the application.

| Observed field | OSM: 68 `amenity=cafe` elements | Overture: 113 selected place records |
| --- | ---: | ---: |
| Name present | 68 | 113 |
| Coordinates or geometry present | 68 | 113 |
| Street address present | 43 with both house number and street | 113 with a nonempty first freeform address |
| City/locality present | 39 with `addr:city` | 113 with a nonempty first locality |
| Website present | 41 | 98 |
| Social link present | 4 with a Facebook or Instagram tag | 76 with a nonempty `socials` list |
| Opening hours present | 22 | Not in the Places schema |

The OSM query used nodes, ways, and relations tagged exactly `amenity=cafe`
and requested center points for ways/relations. Its snapshot reported
`2026-11-12T16:25:41Z`. The social count checks Facebook and Instagram tags
only. Address fields were counted for presence, not accuracy or completeness.

The Overture query used release `2026-10-21.0`, selecting primary taxonomy
values `coffee_shop`, `cafe`, and `coffee_roastery`; nine results were marked
`permanently_closed`. It counted the first address's `freeform` and `locality`
fields and any nonempty website/social list. The [Places guide](https://docs.overturemaps.org/guides/places/)
warns of duplicates, junk, and incomplete properties.

These are **different category filters and record types**, not a matched set or
a verified count of actual coffee shops. A nonempty field does not mean it is
correct, current, or suitable for our use. No ground-truth audit, deduplication,
or accuracy assessment was performed; these counts do not establish which
source has better real-world coverage.

### Reproducing the sample

The OSM [Overpass query](https://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%5Btimeout%3A60%5D%3Bnwr%5B%22amenity%22%3D%22cafe%22%5D%2835.20%2C-80.87%2C35.25%2C-80.80%29%3Bout%20center%20tags%3B)
uses:

```text
[out:json][timeout:60];
nwr["amenity"="cafe"](35.20,-80.87,35.25,-80.80);
out center tags;
```

For Overture, query the `places/type=place` GeoParquet files for the pinned
release using [DuckDB](https://docs.overturemaps.org/getting-data/duckdb/) or
another compatible reader. Filter `bbox.xmin` to `[-80.87, -80.80]`,
`bbox.ymin` to `[35.20, 35.25]`, and `taxonomy.primary` to the three values
above. Releases, schemas, and service responses change over time.

## Recommendation and outstanding checks

1. Use Overture as the preferred initial source; administrators can manually add
   shops that are missing. Review imported candidates for accuracy, duplicates,
   closures, and missing fields rather than requiring exhaustive coverage.
2. Verify the selected release's source metadata and notices, implement the
   applicable license/notice distribution, and confirm refresh cadence,
   operating costs, and update/removal behavior. Check any additional source's
   terms and field-level rights before using it.
3. Present provider records as reviewable candidates before persistence in the
   curated shop database; evaluate a separate temporary staging database.
   Preserve provenance and timestamps when a reviewed draft is saved. Handle
   duplicates, closures, missing fields, and source outages explicitly; never
   treat disappearance from a source as automatic unpublishing.
4. Choose whether an occasional batch extract is sufficient or a hosted API is
   needed. Do not rely on public Overpass as a visitor-facing production backend;
   see its [usage guidance](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html).
5. Design the authorized admin review workflow and publication integration for
   the preferred Overture source, after the outstanding checks. Keep
   shop-controlled verification for hours and manually curated coffee details.
   No data import or paid service has been approved.
