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
  available. The approach to maintaining hours is still to be decided.
- Include mobile coffee businesses without a fixed location in the list without
  placing them on the map.
- Let visitors search or filter shops by neighborhood and type, such as cafe,
  bakery, or mobile coffee business.
- Assign each location one primary type: cafe, bakery, mobile coffee, or coffee
  roaster. Revisit the categories as the directory grows.
- Provide a form for visitors to suggest shops or corrections. Administrators
  review submissions and decide whether to update the directory.
- Collect a shop name, location or address, suggestion details, website or
  social link, and visitor email for follow-up in the suggestion form. Require
  the shop name, suggestion details, and visitor email; location and links are
  optional.
- Make the map and shop information usable on mobile and desktop. Provide a
  list-based way to find shops as an alternative to interacting with the map.
- Deliver a server-rendered web app with a manifest, branded icons, and
  home-screen presentation where supported. No native app is required; offline
  support, service-worker caching, and notifications are deferred.
- Prioritize fast access, quick loading, and availability. Keep the directory
  usable when the map is slow or unavailable.

**How to get there**

1. Start with Charlotte and include nearby communities case by case. Use an
   official neighborhood dataset where available, and use the town or
   community name for nearby places when a neighborhood is not useful.
   Verify dataset coverage, licensing, and update process before using it.
2. Set up a manually curated shop directory that authorized administrators can
   add to and update through a private editor, without code changes. Give each
   entry a stable ID, name, description, city, and type; record its address,
   coordinates, and neighborhood when applicable. Record a source and
   last-verified date so information can be maintained.
3. Build the map, markers, and shop details from that shared dataset. Keep
   filtering consistent between the map and list.
4. Establish a process for reviewing visitor suggestions and entries, checking
   locations and details, and removing outdated information. Restrict directory
   editing to authorized administrators; submissions do not publish directly.
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

Use TanStack Start for the public PWA, Clerk for admin authentication, and a
document database for shop data. The database provider and hosting remain
undecided; "document database" does not mean Amazon DocumentDB specifically.

Prioritize low ongoing cost, easy non-technical content editing, flexibility for
future features, and data ownership and portability. The project owner has
experience with React, TypeScript, Vue, and WordPress.

| Area | Direction | Remaining considerations |
| --- | --- | --- |
| Public web app | TanStack Start with server-side rendering and lightweight PWA presentation | Hosting compatibility, caching, accessibility, and load performance |
| Admin app | Separate private app for creating and editing shops | Editing workflow, framework, and deployment |
| Admin authentication | Clerk | Sign-in method, admin authorization, recovery, and future MFA |
| Map | A map library with OpenStreetMap-compatible data and tile services; a commercial map platform | Cost, usage limits, attribution, accessibility, styling, and provider terms |
| MVP shop data | Document database; provider undecided | Cost, access control, backups, and portability |
| Hosting | SSR-capable hosting and CDN caching | Availability, cold starts, deployment simplicity, and cost |

### Application boundaries and availability

Keep the public discovery app separate from the admin editing app. The public
app's server-side data access must be read-only and expose only published shop
data. Admin writes must verify the Clerk session and explicitly authorize the
admin account on the server; being signed in alone does not grant edit access.
Keep database credentials out of browser code.

Visitor suggestions use a separate submission path. Do not expose submissions
or visitor contact details through public shop reads.

Render useful shop content on the server and load the interactive map
separately. Evaluate CDN caching and cache refresh after edits so most public
requests do not need a database query. SSR alone does not guarantee speed or
availability; assess hosting reliability, cold starts, and behavior during
dependency outages. Do not cache authenticated admin responses as public data.

### Delivery and releases

Use Release Please as part of the CI pipeline once application development
begins. The release workflow should use the repository's Conventional Commits
to prepare release pull requests, update changelogs and versions, and create
GitHub releases. Do not configure or enable the workflow until the application
and deployment targets exist.

### White-label reuse

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

Evaluate document database providers and plans that fit the project's budget.
No database provider has been selected. Confirm the
approach supports a private editor for authorized administrators, data and
media export, backups, and access control. A modest recurring cost is
acceptable. Keep visitor contact details out of public shop data.

Use Clerk for managed authentication in the admin editor. Operating without
multi-factor authentication (MFA) is acceptable for
now, but increases the risk of an admin account compromise and unauthorized
shop edits. Reevaluate MFA as the project grows or its security needs change,
and verify the chosen provider's available sign-in methods, MFA support, and
cost before launch.

Keep the shop data separate from map presentation, and use stable location
IDs from the start. Include an explicit region relationship in the data model so
future expansion does not depend on Charlotte-specific assumptions. Avoid
designing journal storage or building account infrastructure or a multi-city
management system before those stages need them.

## Open MVP decisions

- Which official neighborhood dataset should be used, and how should locations
  be labeled where it does not provide suitable coverage?
- Which document database provider, photo storage, and admin editing workflow
  best meet the cost, maintenance, access control, and portability requirements?
- How should opening hours be maintained, and how often should other details be
  verified?
- How should suggestion submissions reach administrators?
- Which map provider and SSR hosting/caching approach best fit the project's
  budget, availability goals, and maintenance preferences?

Journal and expansion decisions, including the rating scale and next city, are
deferred until those stages.

## Project assets

The existing logo is available at `static/images/logos/CLTCOFFEE.png`. Its
eventual placement and use can be decided alongside the application's design.
