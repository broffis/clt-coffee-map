# 0003: Build a React admin editor with TanStack Start and Form

## Status

Accepted on 2026-11-09. Related work: [#51](https://github.com/broffis/clt-coffee-map/issues/51).

## Context

Administrators need to curate shops without code changes. The selected
services are MongoDB Atlas for shop data, Clerk for authentication, and
Cloudflare R2 for photos with upload-time resizing. The admin app must remain
separate from public discovery, with explicit server-side edit authorization.

A focused editor can fit these workflows without adapting a general-purpose
CMS. Using the same React and TanStack Start foundation as the public app
reduces framework diversity while preserving the application boundaries.

## Decision

Build a custom private admin application with React and TanStack Start.
Use TanStack Form's React adapter for form state, field validation, and
submission handling. TanStack Form is a separate library, not a built-in
Start plugin or a prebuilt admin interface.

Keep all privileged operations on the server. Verify Clerk sessions and
explicitly authorize administrators for reads of private admin data and for
writes. Validate external input on the server regardless of client form
validation. Keep database and storage credentials out of browser code.

The editor must support curated shop/location fields, draft and publication
management, and R2 uploads resized before publication. Accommodate the
visitor-suggestion review workflow without publishing submissions directly;
suggestion delivery remains a separate decision.

Defer detailed form layouts, UI components, validation-library choice, package
versions, and image-processing implementation to development. Hosting and
deployment remain undecided; this choice does not provision services.

## Alternatives

### Existing CMS or generic admin tool

Could reduce initial form-building work, but would need evaluation for Atlas,
Clerk authorization, R2 upload processing, accessibility, portability, and
cost. Prefer a focused editor that fits the selected service boundaries.

### React with a different application framework or form library

Viable, but introduces additional framework conventions or duplicates form
state handling without a demonstrated benefit for this MVP.

## Consequences

- TanStack Form simplifies form handling but does not supply the complete
  editor UI, persistence, authorization, or accessible interactions for us.
- Own and test forms, server validation, save/error feedback, publication
  boundaries, and the admin editing experience.
- Preserve the separate public read-only app and private admin boundaries;
  shared framework choices do not grant the public app write access.
- Confirm compatible React, Start, Form, and Clerk versions during scaffolding,
  and validate hosting support for Atlas access and photo processing.
- Apply incremental TDD and WCAG 2.2 AA requirements to critical admin flows.

## References

- [TanStack Form overview and React adapter](https://tanstack.com/form/latest/docs/overview)
- [Atlas decision](0001-mongodb-atlas.md)
- [Photo storage decision](0002-r2-photo-storage.md)
