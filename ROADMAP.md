# CLT Coffee Map Roadmap

## Vision

Create a resource for discovering local coffee shops and, eventually, keeping
track of visits and personal impressions. Start in the Charlotte, North Carolina
area, with a structure that can grow to support other cities.

## Product stages

### 1. MVP: Discover Charlotte coffee shops

Build a public, account-free directory that makes it easy to find local spots.

**Experience**

- Show shops with a known location on a map, with a marker for each location.
- Show a simple description and available location information for each shop.
- Show the map and list side by side on desktop, with a toggle between them on
  mobile. Open shop details in a panel or popup without leaving discovery.
- Let visitors choose whether to limit list results to the current map area.
- Include website, social media, menu link, photo, and opening hours when
  available. Administrators maintain verified regular weekly hours with a
  source and last-verified date, reviewing them every three months and sooner
  when changes are reported. Link to the shop for current/holiday information;
  do not guess missing hours.
- Include mobile coffee businesses without a fixed location in the list without
  placing them on the map.
- Let visitors search or filter shops by neighborhood and type, such as cafe,
  bakery, or mobile coffee business.
- Assign each location one primary type: cafe, bakery, mobile coffee, or coffee
  roaster. Revisit the categories as the directory grows.
- Include the bean roaster, coffee options (espresso, drip, pour-over, cold
  brew, and milk drinks), non-coffee drinks, and food when known. Food options
  include baked goods, sandwiches, full menu, breakfast items, and salads.
  Administrators curate and verify these details; distinguish unknown
  information from a confirmed absence.
- Provide a form for visitors to suggest shops or corrections. Administrators
  review submissions in a private admin inbox and decide whether to update
  the directory. Store submissions separately in Atlas; administrators check
  the inbox manually, with no email notifications initially.
- Collect a shop name, location or address, suggestion details, website or
  social link, and visitor email for follow-up in the suggestion form. Require
  the shop name, suggestion details, and visitor email; location and links are
  optional.
- Make the map and shop information usable on mobile and desktop. Provide a
  list-based way to find shops as an alternative to interacting with the map.
- Deliver a prerendered public web app with a manifest, branded icons, and
  home-screen presentation where supported. No native app is required; offline
  support, service-worker caching, and notifications are deferred.
- Prioritize fast access, quick loading, and availability. Keep the directory
  usable when the map is slow or unavailable.

**How to get there**

1. Start with Charlotte and include nearby communities case by case. Curate
   recognizable neighborhood labels and administrator-reviewed location
   assignments, with stable region-linked IDs and source/verification metadata.
   Use the town or community name where a neighborhood is not useful, without
   changing the actual city relationship. Defer boundary dataset selection;
   verify coverage, licensing, and update process before any future import.
2. Set up a manually curated shop directory that authorized administrators can
   add to and update through a private editor, without code changes. Give each
   entry a stable ID, name, description, city, and type; record its address,
   coordinates, and neighborhood when applicable. Record a source and
   last-verified date so information can be maintained. Use Overture Places as
   the preferred initial source of location candidates; administrators can
   manually add missing shops and periodically review potential changes.
3. Build the map, markers, and shop details from that shared dataset. Keep
   filtering consistent between the map and list.
4. Establish a process for reviewing visitor suggestions and entries, checking
   locations and details, and removing outdated information. Restrict directory
   editing to individually approved users; the project owner controls
   invitations, approval, revocation, and blocking. Revocation removes all
   private admin access, even for existing sessions. Submissions do not
   publish directly.
5. Test the main discovery flows, accessibility, responsive layouts, and the
   production deployment before launch.

**MVP is ready when** visitors can discover the curated Charlotte shops in a
list and see those with known locations on a map, narrow them by neighborhood
and type, and view accurate basic details without an account.

### 2. Personal coffee journal

Add accounts so people can keep a personal record of their coffee exploration.

- Let users sign up, log in, and manage their account.
- Let users mark shops as visited and save favorites.
- Let users record a visit date, what they ordered, their thoughts, and a rating;
  allow them to edit or remove entries. Journal entries are private to the user
  initially.
- Allow a user to mark a location visited without entering details. Default the
  visit date to the day it was marked, and allow the user to edit it and add or
  change details later.
- Provide a way to revisit saved shops and notes.

**How to get there**

1. Choose an authentication and persistent storage approach.
2. Model users, favorites, and visits separately from the curated shop data.
   Link them to stable shop and location IDs; support multiple visits to a shop.
3. Add account and journal interfaces to the existing discovery experience.
4. Protect each user's data, provide account and data deletion, and test
   permissions, validation, and common account recovery flows.

**This stage is ready when** a user can reliably save, revisit, edit, and
delete their own visits, notes, and favorites across sessions.

### 3. Expand beyond Charlotte

Extend discovery to other cities without rebuilding the experience for each one.

- Add city selection and city-specific shop discovery.
- Require visitors to switch cities or regions explicitly rather than mixing
  their shop results.
- Support both a multi-region app and separately branded city or region apps
  using the same platform.
- Organize neighborhoods and shop locations under their respective cities.
- Establish a repeatable process for researching, verifying, and maintaining
  each new city's curated data.
- Keep personal visits and favorites associated with the right location across
  cities.

**How to get there**

1. Review the data model and navigation against at least one additional city,
   including cases where neighborhood or shop names overlap.
2. Add and verify a second city's dataset, then adapt map positioning,
   filtering, and city selection.
3. Document the workflow and ownership for adding and maintaining future cities.

**This stage is ready when** visitors can select between at least two cities
and find the correct shops and neighborhoods in each.

## Technical approach

Use TanStack Start for the public PWA, Clerk for admin authentication, and
MongoDB Atlas for shop data. Use Vercel initially, with required prerendering
for public directory content and portability to other hosts. See
[ADR 0001](docs/decisions/0001-mongodb-atlas.md) for the database decision and
[ADR 0006](docs/decisions/0006-vercel-prerendered-hosting.md) for hosting.
The public framework, lightweight PWA scope, and application boundaries are
recorded retrospectively in
[ADR 0011](docs/decisions/0011-public-application-foundation.md).

Prioritize low ongoing cost, easy non-technical content editing, flexibility for
future features, and data ownership and portability. The project owner has
experience with React, TypeScript, Vue, and WordPress.

| Area | Direction | Remaining considerations |
| --- | --- | --- |
| Public web app | TanStack Start with prerendered public content and lightweight PWA presentation | Publication workflow, caching, accessibility, and load performance |
| Admin app | Separate custom React app using TanStack Start and TanStack Form | Detailed editing UX, integration, and deployment |
| Admin authentication | Clerk email codes, invite-only, owner-approved per-user access | Production sign-in/recovery validation, owner continuity, revocation/blocking tests, and future MFA |
| Map | Leaflet with Stadia Maps raster tiles; keep provider replaceable | Style, eligibility, cost, usage limits, attribution, accessibility, and provider terms |
| MVP shop data | MongoDB Atlas | Tier, cost, access control, backups, and portability |
| Initial location candidates | Overture Places downloadable data, reviewed by admins | Release-specific notices, staging, refresh, cost, and review workflow |
| Shop photos | Cloudflare R2 Standard; resize images during upload | Processing runtime, dimensions/formats, original retention, delivery, and recovery |
| Hosting | Vercel initially; separate public/admin projects and portable static public output | Eligibility, server runtime compatibility, publication/cache behavior, availability, and cost |

### Application boundaries and availability

Keep the public discovery app separate from the admin editing app. The public
app's server-side data access must be read-only and expose only published shop
data. Admin writes must verify the Clerk session and explicitly authorize the
admin account on the server; being signed in alone does not grant edit access.
Keep database credentials out of browser code.

Use invite-only email-code sign-in and explicit per-user approval, per
[ADR 0010](docs/decisions/0010-email-code-admin-access.md). Only the project
owner manages invitations and permissions initially. Provide clear owner-only
controls to approve, revoke, block, and explicitly restore access. Revocation
removes all private admin access, not just editing. Enforce current
server-managed permissions for existing and future sessions; new codes,
invitations, or recreated accounts must not automatically restore privileges.
Application blocking does not require Clerk's paid user-ban feature.

Visitor suggestions use a separate submission path. Do not expose submissions
or visitor contact details through public shop reads. Deliver them to an
Atlas-backed private admin inbox, per
[ADR 0009](docs/decisions/0009-private-suggestion-inbox.md), with explicit
admin authorization and no email-service dependency. Confirm successful
persistence before reporting submission success.

Preserve the option for future age-based inbox cleanup, but do not enable
automatic deletion without an agreed retention period, age reference, eligible
review states, and deletion scope. In particular, do not assume unread entries
may expire. Cleanup must not delete independently curated shop records.
Document actual retention and privacy behavior before collecting submissions;
automatic cleanup is not required at launch by this decision.

Prerender useful public directory and shop-detail HTML and load the interactive
map separately. Serve published-only public data without requiring a database
query per visit. Verify direct URLs, browser navigation, filtering, and map
data work on static hosting without Vercel server functions for directory reads.
Keep server operations for admin writes, image processing, and submissions.

Publishing changes requires public output regeneration, deployment, and cache
handling; saving an edit is not the same as making it publicly visible.
Agree freshness targets and design deployment triggers, cache durations,
invalidation, and publication failure feedback during implementation,
including unpublishing. Use standard HTTP caching for public content and
versioned assets; use `private, no-store` for sensitive admin and submission
responses. Assess hosting reliability, server cold starts, and dependency
outages before launch. Offline/service-worker features remain deferred.

Avoid Vercel-specific dependencies where practical and keep necessary
host integrations at deployment boundaries. Document every such dependency
with its rationale, cost or limits, and migration/replacement steps.
The static public site and backend may migrate independently; moving to a
different server runtime still requires compatibility testing.

### Map rendering

Use Leaflet for the discovery map, per
[ADR 0004](docs/decisions/0004-leaflet-map-rendering.md). Keep curated shop data
independent of the renderer and tile provider. Use Stadia Maps raster tiles
initially, per [ADR 0005](docs/decisions/0005-stadia-map-tiles.md), and keep
provider configuration replaceable if cost, limits, eligibility, quality, or
terms change. Select a simple style with readable streets at close zoom during
implementation; confirm free-plan eligibility and attribution before deployment.

Keep neighborhood filtering in the MVP. Defer colored neighborhood polygon
overlays while preserving the capability to add them later. Use curated
neighborhood labels and admin-reviewed assignments, per
[ADR 0007](docs/decisions/0007-curated-neighborhood-labels.md), rather than
importing a boundary dataset now. Keep future geometry separate from stable
label IDs. Official references can inform verification but do not establish
unrestricted reuse permission; review the exact dataset's terms before import.
Validate real marker and boundary data on mobile before adding
clustering or other rendering optimizations; there is no fixed Leaflet marker
cap or measured application performance limit yet.

### Delivery and releases

Use Release Please as part of the CI pipeline once application development
begins. The release workflow should use the repository's Conventional Commits
to prepare release pull requests, update changelogs and versions, and create
GitHub releases. Do not configure or enable the workflow until the application
and deployment targets exist.

### White-label reuse

The existing region and branding portability direction is recorded in
[ADR 0012](docs/decisions/0012-region-and-branding-portability.md); it does
not add multi-region management or multi-tenant infrastructure to MVP.

Keep branding, including name, logo, colors, and enabled regions, configurable
rather than hard-coded into the platform. Give shops a stable region ID while
retaining city and neighborhood information. Launch Charlotte first; defer the
multi-region interface and management workflow until expansion.

Allow future reuse for both a multi-region app with a manual region switcher
and separately branded regional deployments. Licensing to independent operators
is a future possibility, not MVP scope. An operator may manage multiple regions;
a region is not itself an authorization boundary. Defer the choice between
isolated operator deployments and shared infrastructure with enforced operator
isolation, along with licensing, billing, and self-service setup.

### Shop data direction

WordPress is not planned for the MVP because of cost concerns; reevaluate it
later if the project's needs change. See [WP_EVALUATION.md](WP_EVALUATION.md)
for the closed evaluation.

Use MongoDB Atlas for MVP shop storage, as recorded in
[ADR 0001](docs/decisions/0001-mongodb-atlas.md). Evaluate its free tier first;
confirm hosting compatibility, capacity, availability, exports, backups, and
restoration before launch. Prefer free tiers where practical and discuss any
recurring cost before proceeding. Build the private editor with React,
TanStack Start, and TanStack Form, per
[ADR 0003](docs/decisions/0003-tanstack-admin-editor.md); detailed editing UX
and deployment configuration remain open.
Keep visitor contact details out of public shop data.

Use Overture Places as the preferred initial source of shop location candidates;
see [LOCATION_DATA.md](LOCATION_DATA.md) for the evaluation and licensing
review. Source records can suggest names, addresses, coordinates, categories,
websites, and social links where available. Administrators review and edit
candidates before saving them to the curated shop database as unpublished
drafts; publishing is a separate action. Never display source records directly
to visitors, automatically overwrite curated shops, or automatically unpublish
shops absent from a later source release. Keep internal IDs independent of
source IDs and retain source and verification metadata.

Consider a separate private, temporary staging database for downloaded source
records, replaced when refreshed. Its storage, authorization, retention,
failure handling, concurrent reviews, and handling of interrupted edits remain
open; refreshing staged data must not alter curated drafts or published shops.
Before import or distribution, verify the chosen release's sources, licensing,
and notices, and provide applicable attribution, license texts, and notices
with public output and exports. Review costs and update behavior before enabling
the integration.

Store shop photos in Cloudflare R2 Standard and resize them during the upload
workflow before publication, as recorded in
[ADR 0002](docs/decisions/0002-r2-photo-storage.md). Store photo references in
Atlas, not image bytes. Processing runtime, image dimensions/formats, original
retention, delivery, and media recovery still need to be designed.

Maintain regular weekly hours manually from shop-controlled sources, per
[ADR 0008](docs/decisions/0008-manually-maintained-opening-hours.md). Review
every three months and investigate reported changes sooner. Keep verification
specific to hours, distinguish unknown hours from closed days, and do not
present regular schedules as live availability. No automated hours provider,
scraping, or reminder system is selected.

Use Clerk's prebuilt authentication screens for email-code sign-in where
practical. Do not enable password or social fallback methods without a
reviewed decision. Evaluate Hobby; pricing reviewed on 2026-11-09 lists free
email codes and a fixed seven-day session lifetime. Production MFA/passkeys
require a paid plan; Pro lists $25/month or $20/month billed annually.
Recheck costs, limits, and email delivery before launch.

Normal recovery depends on mailbox access, not a password reset. Recommend
mailbox MFA and recovery preparation, without claiming it enforces Clerk MFA.
Define and test trusted initial-owner setup, protection against accidental
sole-owner lockout, and out-of-band recovery before launch. Do not restore
approval to a replacement identity automatically.

Operating without Clerk multi-factor authentication (MFA) remains acceptable
for now but increases account-compromise risk. Reevaluate MFA as the project
grows or its security needs change; discuss recurring costs before upgrading.
Documented provider options are not a substitute for production sign-in,
recovery, authorization, and revocation tests.

Keep the shop data separate from map presentation, and use stable location
IDs from the start. Include an explicit region relationship in the data model so
future expansion does not depend on Charlotte-specific assumptions. Avoid
designing journal storage or building account infrastructure or a multi-city
management system before those stages need them.

## Open MVP decisions

- Which Atlas tier best meets the cost, maintenance, access control, and
  portability requirements?
- How often should shop details other than opening hours be verified?
- Which Stadia map style and admin geocoding approach, if needed, best fit the
  project's budget and maintenance preferences?
- What publication freshness targets, deployment triggers, cache durations,
  invalidation, and failure handling should be used for prerendered content,
  including unpublishing?
- How should Overture candidate staging and refresh work, including
  authorization, review completion, interrupted edits, retention, and failures?

Image-processing runtime, dimensions/formats, original retention, and R2
delivery, replacement/deletion, and recovery details are deferred to
implementation of the photo workflow, not prerequisites to starting development.
Resolve and validate them before launch.

Boundary dataset selection, coverage/licensing review, and synchronization are
deferred until geographic boundaries are needed. MVP neighborhood filtering
uses curated labels; no boundary dataset has been approved for import.

Automatic age-based suggestion deletion is a future option. Its retention
period, eligible entries, deletion scope, and implementation are not selected;
agree them before implementing or enabling cleanup.

Journal and expansion decisions, including the rating scale and next city, are
deferred until those stages.

## Project assets

The existing logo is available at `static/images/logos/CLTCOFFEE.png`. Its
eventual placement and use can be decided alongside the application's design.
