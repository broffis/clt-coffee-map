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

The planned product is a public, prerendered PWA for discovering Charlotte
coffee shops, with a separate private admin application for curating shop data.
Use TanStack Start to prerender useful public directory and shop-detail HTML;
the interactive map loads separately so list and details remain useful if map
tiles or map JavaScript are slow or unavailable.
See [ADR 0011](../docs/decisions/0011-public-application-foundation.md) for the
public framework, lightweight PWA scope, and separate public/admin boundaries.

Use Vercel initially for separate public and admin projects, per
[ADR 0006](../docs/decisions/0006-vercel-prerendered-hosting.md). Keep public
discovery statically hostable, with published-only data and no dependency on
Vercel server functions for directory reads. Server operations remain necessary
for admin writes, photo processing, and visitor submissions. Avoid Vercel-specific
dependencies where practical; document every introduced dependency, including
configuration and deployment/cache integrations, with its rationale, cost or
limits, and replacement/removal steps. Keep host-specific code at deployment
boundaries; use an ADR for significant lock-in.

Build the separate custom React admin editor with TanStack Start and TanStack
Form, per [ADR 0003](../docs/decisions/0003-tanstack-admin-editor.md). Form
handling does not replace server validation or explicit admin authorization.

Use Leaflet for the discovery map, per
[ADR 0004](../docs/decisions/0004-leaflet-map-rendering.md), initially with
Stadia Maps raster tiles per [ADR 0005](../docs/decisions/0005-stadia-map-tiles.md).
Keep tile-provider configuration replaceable and shop data independent of map
APIs; reevaluate the provider if costs, limits, eligibility, or quality change.
Specific style selection remains open. Preserve
optional neighborhood overlays without assuming they are required. Measure
real mobile marker performance before adding clustering or other optimizations.

The public data path is read-only and exposes only published shops. Admin
writes must run on the server, verify a Clerk session, and explicitly authorize
the admin account; authentication alone is not edit authorization. Keep
database credentials out of browser code. Visitor suggestions use a separate
submission path and must not be exposed through public shop reads.

Use Clerk email codes and invite-only enrollment, per
[ADR 0010](../docs/decisions/0010-email-code-admin-access.md). Invitation and
login do not grant editing permission. Only the project owner manages
invitations and per-user approvals, revocation, blocking, and restoration
initially; editors cannot manage access. Keep authorization server-managed,
keyed by Clerk user ID, and deny by default. Enforce current permissions on
every privileged operation, including private reads and existing sessions;
do not trust stale approval claims or user-editable metadata. Revocation
removes all private admin access. New sessions, invitations, or recreated
accounts must not automatically restore it. Do not rely on paid Clerk bans.
No password/social fallback is selected. Evaluate Hobby without Clerk MFA
for now; verify costs, delivery, owner bootstrap/recovery, and revocation
before launch. Mailbox MFA is recommended, not an app-level MFA guarantee.

Store suggestions separately in Atlas for a private admin inbox, per
[ADR 0009](../docs/decisions/0009-private-suggestion-inbox.md). Require explicit
admin authorization for inbox access and review; no email notifications
initially. Report submission success only after persistence. Keep submissions
out of prerendered output and shared caches. Age-based automatic cleanup is
an optional future capability, not enabled by default: agree the retention
period, age reference, eligible review states, and deletion scope first.
Never let inbox cleanup delete independently curated shop records.

Shop records belong in MongoDB Atlas, selected in
[ADR 0001](../docs/decisions/0001-mongodb-atlas.md). Store photos in Cloudflare
R2 Standard and resize them during upload before publication, per
[ADR 0002](../docs/decisions/0002-r2-photo-storage.md). Store photo references,
not image bytes, in Atlas. The Atlas tier, image-processing details,
map style, publication workflow, cache freshness/invalidation, and detailed
admin UX are still undecided. Validate Vercel eligibility and runtime integration
before launch; discuss recurring costs before upgrading. Preserve portability
with stable shop/location IDs, explicit region
relationships, source and last-verified metadata, and exportable data/media.
Keep map presentation separate from the shop data model.

The MVP is Charlotte-first, with nearby communities added case by case. A
location has one primary type (`cafe`, `bakery`, `mobile coffee`, or `coffee
roaster`). Fixed-location shops appear on the map; mobile businesses without a
fixed location appear in the list only. Filtering by neighborhood and type
must stay consistent between the map and list.

Curate neighborhood labels and admin-reviewed location assignments, per
[ADR 0007](../docs/decisions/0007-curated-neighborhood-labels.md), with stable
region-linked IDs and source/verification metadata. Use town/community labels
where useful without changing actual city relationships. Boundary datasets and
overlays remain deferred; do not infer assignments from statistical areas or
import source data without verifying the exact coverage and reuse terms.

Maintain regular weekly hours manually from shop-controlled sources, per
[ADR 0008](../docs/decisions/0008-manually-maintained-opening-hours.md), with
an hours-specific source and last-verified date. Review every three months and
investigate reported changes sooner. Distinguish unknown hours from closed
days; do not guess schedules or imply live/holiday availability. No automated
hours provider, scraping, or reminder system is selected.

Preserve region and branding portability per
[ADR 0012](../docs/decisions/0012-region-and-branding-portability.md). Keep
explicit geographic relationships and stable IDs from the beginning, with
branding and enabled regions as configuration concerns. A region is not a
tenant or an authorization boundary. Launch Charlotte first and defer
multi-region management, operator-isolation topology, journaling, licensing,
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
