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

## Technical approach: options to evaluate

Decisions remain open; select tools based on the desired experience, operating
cost, maintenance effort, and terms of use.

Prioritize low ongoing cost, easy non-technical content editing, flexibility for
future features, and data ownership and portability. The project owner has
experience with React, TypeScript, Vue, and WordPress.

| Area | Options to consider | Decision factors |
| --- | --- | --- |
| Web app | Static site or client-rendered app; a full-stack web framework | MVP simplicity, future accounts, hosting, and developer experience |
| Map | A map library with OpenStreetMap-compatible data and tile services; a commercial map platform | Cost, usage limits, attribution, accessibility, styling, and provider terms |
| MVP shop data | Managed content management system; hosted database with an admin interface | Non-code editing, access control, cost, backups, and migration as the directory grows |
| Accounts and storage | Managed authentication and database; a custom backend and database | Security, operational overhead, portability, cost, and data ownership |
| Hosting | Static hosting for the MVP; a platform supporting server-side functions or a backend later | Deployment simplicity, future requirements, and cost |

### Content management comparison

Evaluate headless WordPress first, with a separate frontend consuming its REST
API. This is a direction to validate, not a final CMS decision. Compare it with
a hosted CMS if it does not meet the project's needs.

Use Local (formerly Local by Flywheel) to develop and evaluate WordPress on a
computer. Local is a development environment, not the live hosting decision;
production hosting remains open.

| | WordPress | Hosted CMS with a separate frontend |
| --- | --- | --- |
| Editing | Familiar admin interface; structured shop fields may need configuration or plugins | Typically provides a structured content editor; capabilities vary by provider |
| Operations | Self-hosting provides control but requires hosting, updates, and backups; managed hosting reduces that work | Provider manages the CMS, while the frontend still needs hosting |
| Cost and portability | Hosting and plugins may cost money; evaluate export of structured fields and images | Pricing, usage limits, export formats, and media portability depend on the provider |
| Future features | Evaluate integration with user accounts, visits, and favorites separately from content editing | A separate frontend can integrate account and journal services; CMS and service compatibility still need review |

Evaluate real providers and plans against the project's budget, admin workflow,
data export, backups, access control, and future account needs before deciding.
For WordPress, prototype a structured shop entry and verify how administrators
edit fields and photos, how the frontend reads them, and how both structured
data and media can be exported. Compare managed and self-hosted options,
including hosting, plugin, maintenance, and backup costs. A modest recurring
cost is acceptable. Keep private user journals and visitor contact details out
of public shop data.

Keep the shop data separate from map presentation, and use stable location
IDs from the start. Include an explicit city relationship in the data model so
future expansion does not depend on Charlotte-specific assumptions. Avoid
building account infrastructure or a multi-city management system before those
stages need it.

## Open decisions

- Which official neighborhood dataset should be used, and how should locations
  be labeled where it does not provide suitable coverage?
- Does headless WordPress meet the admin editor, cost, maintenance, and
  portability requirements, and should it be managed or self-hosted?
- Which production host should run WordPress after local development?
- How should opening hours be maintained, and how often should other details be
  verified?
- How should suggestion submissions reach administrators?
- Which map provider, application stack, and hosting option best fit the
  project's budget and maintenance preferences?
- What rating scale should the journal use?
- Which city should be added next, and what criteria make a city ready to launch?

## Project assets

The existing logo is available at `static/images/logos/CLTCOFFEE.png`. Its
eventual placement and use can be decided alongside the application's design.
