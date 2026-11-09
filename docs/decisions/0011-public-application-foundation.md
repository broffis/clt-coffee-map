# 0011: Use TanStack Start for a lightweight PWA with separate admin boundaries

## Status

Accepted. Recorded retrospectively on 2026-11-09 from existing roadmap
decisions. Related work: [#51](https://github.com/broffis/clt-coffee-map/issues/51).

This records the public application foundation assumed by earlier ADRs.
It does not supersede the later prerendering and hosting decision in
[ADR 0006](0006-vercel-prerendered-hosting.md).

## Context

The MVP is an account-free coffee directory with useful shop content even
when the interactive map is slow or unavailable. Administrators need a
separate private editing experience, while journaling and visitor accounts
belong to later stages.

The project owner has React/TypeScript experience and wants to deepen TanStack
experience. TanStack Start supports the server-generated
HTML direction without requiring the public directory to wait for
client-side data fetching. Framework choice alone does not establish
availability, fast delivery, or correct caching.

The earlier WordPress evaluation was closed as "Not for MVP. Reevaluate
later" because of cost concerns. Its proposed proof of concept was not
completed; it is not evidence that WordPress is technically unsuitable.

## Decision

Use TanStack Start for the public web application. Deliver useful shop
list/detail HTML and load the interactive map separately. Preserve complete
list-based discovery rather than making map rendering a prerequisite for
finding shops.

Provide lightweight PWA presentation using a web app manifest, branded
icons, and home-screen/standalone presentation where supported. Do not
require native apps. Defer service-worker caching, offline functionality,
and notifications; a manifest alone does not guarantee identical
installation behavior across browsers.

Keep the public discovery app separate from the private admin app. Public
directory access is read-only and published-only. Admin operations run on
the server with authentication, explicit authorization, and validation.
Keep database/storage credentials, drafts, submissions, and visitor contact
details out of the public directory output.

Visitor suggestions use a separate submission path, not permission to
write curated shops. Public discovery and suggestions do not require
visitor accounts. Future private journal data must remain distinct from
the curated public dataset.

Use the existing follow-up decisions for details rather than reopening
them here:

- [ADR 0003](0003-tanstack-admin-editor.md) selects the custom Start/Form
  admin editor.
- [ADR 0004](0004-leaflet-map-rendering.md) selects the separately loaded map.
- [ADR 0006](0006-vercel-prerendered-hosting.md) requires prerendered public
  content, static-host portability, and initial Vercel deployment.
- [ADR 0009](0009-private-suggestion-inbox.md) defines private suggestion
  delivery, and [ADR 0010](0010-email-code-admin-access.md) defines admin
  authentication and owner-managed permissions.

These are application and data-access boundaries, not a requirement for
microservices or a newly selected repository/package layout.

## Alternatives

### Client-only discovery application

Would make initial shop content depend on browser JavaScript and data
fetching unless another HTML-generation mechanism were added. Prefer useful
HTML before interactive map startup.

### Another server-rendering framework

Remains technically viable. TanStack Start fits the existing React direction
and learning goals; no comparative performance benchmark or framework proof
of concept was performed.

### WordPress-backed MVP

Could provide content editing, but was deferred for cost reasons in
[WP_EVALUATION.md](../../WP_EVALUATION.md). Revisit that recorded decision
before introducing it, rather than treating it as an approved dependency.

### Full offline PWA or native application

Adds cache freshness, platform, and maintenance responsibilities without an
MVP requirement. Keep the lightweight home-screen experience and defer those
capabilities until their product stage.

## Consequences

- Shared React/Start choices reduce framework diversity, but do not replace
  server authorization, accessible UI, or explicit publication/cache design.
- Test useful initial HTML, map-independent discovery, public/private data
  separation, and supported home-screen presentation during implementation.
  Do not claim universal installation or offline availability.
- No application scaffolding, PWA tooling, service worker, framework
  dependency, or runtime validation is introduced by this retrospective record.

## References

- [Roadmap and application boundaries](../../ROADMAP.md)
- [Historical WordPress evaluation](../../WP_EVALUATION.md)
- [TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [TanStack Start prerendering](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering)
