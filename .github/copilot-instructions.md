# Copilot instructions

## Repository status and commands

This repository is currently in the planning stage. It contains the product
roadmap, the historical WordPress evaluation, and the logo asset; there is no
application source, package manifest, or configured build, test, or lint
command yet.

Do not invent commands or claim that validation has run. When implementation
begins, document the actual package-manager scripts here, including the
targeted command for running one test.

## Architecture

The planned product is a public, server-rendered PWA for discovering Charlotte
coffee shops, with a separate private admin application for curating shop data.
The public app is planned for TanStack Start and should render useful shop
content server-side; the interactive map loads separately so list and details
remain useful if map tiles or map JavaScript are slow or unavailable.

The public data path is read-only and exposes only published shops. Admin
writes must run on the server, verify a Clerk session, and explicitly authorize
the admin account; authentication alone is not edit authorization. Keep
database credentials out of browser code. Visitor suggestions use a separate
submission path and must not be exposed through public shop reads.

Shop records belong in a document database, but the provider, photo storage,
map provider, SSR hosting, caching strategy, and admin editor are still
undecided. Preserve portability with stable shop/location IDs, explicit region
relationships, source and last-verified metadata, and exportable data/media.
Keep map presentation separate from the shop data model.

The MVP is Charlotte-first, with nearby communities added case by case. A
location has one primary type (`cafe`, `bakery`, `mobile coffee`, or `coffee
roaster`). Fixed-location shops appear on the map; mobile businesses without a
fixed location appear in the list only. Filtering by neighborhood and type
must stay consistent between the map and list.

Branding and enabled regions should eventually be configurable. Launch
Charlotte first and defer multi-region management, journaling, licensing,
billing, and offline/service-worker features until their roadmap stages.

## Repository conventions

- Use the single GitHub Project and repository issues described in
  [CONTRIBUTING.md](CONTRIBUTING.md) to read and update work status each session.
- Follow [CONTRIBUTING.md](CONTRIBUTING.md) for branch, PR, commit, release,
  testing, tooling, architecture decision, data validation, and accessibility
  policies, including strict incremental TDD and 90% branch coverage.
- Treat `ROADMAP.md` as the source of truth for product scope, boundaries, and
  deferred work.
- Keep public curated shop data separate from visitor contact details,
  suggestions, admin credentials, and future private journal data.
- Do not add a shop directly from a visitor submission; administrators review
  and publish changes.
- Preserve `static/images/logos/CLTCOFFEE.png` unless an intentional asset
  migration is made.
- Do not reintroduce WordPress as the MVP implementation without revisiting
  the decision recorded in `WP_EVALUATION.md`.
- Avoid hard-coding Charlotte-specific assumptions into shared models or
  application boundaries; use explicit region/city relationships from the
  beginning.
