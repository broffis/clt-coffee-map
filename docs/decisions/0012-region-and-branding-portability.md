# 0012: Preserve region and branding portability without building multi-tenancy

## Status

Accepted. Recorded retrospectively on 2026-11-09 from existing roadmap
decisions. Related work: [#51](https://github.com/broffis/clt-coffee-map/issues/51).

This records the reuse direction already assumed by the data and application
decisions; it does not move expansion or licensing into MVP.

## Context

Launch Charlotte first and include nearby communities case by case. The
platform should remain reusable for other regions, both within an app with
explicit region selection and as separately branded regional deployments.
Licensing to independent operators is a future possibility, not a current
product or infrastructure commitment.

Hard-coded Charlotte assumptions would make later reuse more expensive.
Building a multi-operator platform now would add management, authorization,
billing, and deployment complexity before those requirements are known.

## Decision

Use stable shop and location IDs with explicit region/city relationships from
the initial data model. Preserve neighborhood relationships within that
geographic context, per [ADR 0007](0007-curated-neighborhood-labels.md).
Do not use mutable display names or branding as record identity, or assume a
region must always be interchangeable with one city.

Keep shared models and application boundaries independent of Charlotte-specific
names or geography. Treat branding values such as name, logo, colors, and
enabled regions as configuration concerns rather than fixed platform
assumptions. Implement only the configuration needed for the current app,
not a self-service branding or region-management system.

Support the future directions of:

- A multi-region application where visitors explicitly select their region,
  rather than silently mixing results from different places.
- Separately branded regional deployments using the same platform.

Launch only the Charlotte-first experience now. Defer multi-region selection
UI, management workflows, and additional region onboarding to expansion.
Keep stable identities so later journal entries and favorites can reference
the correct locations without depending on display names.

A region is a content relationship, not automatically a tenant or an
authorization boundary. An operator may eventually manage more than one
region. Do not infer access rights from the selected region or a client-side
filter; current admin permissions follow
[ADR 0010](0010-email-code-admin-access.md).

Defer the choice between isolated operator deployments and shared
infrastructure with enforced operator isolation. Do not add licensing,
billing, operator onboarding, or multi-tenant infrastructure under this
decision.

Keep curated data and media exportable, consistent with
[ADR 0001](0001-mongodb-atlas.md) and
[ADR 0002](0002-r2-photo-storage.md). Configurable branding and region links
reduce reuse work; they do not prove that deployment isolation, licensing,
or migration is already implemented.

## Alternatives

### Charlotte-specific application with later redesign

Reduces some initial modeling work but couples shared identities and
boundaries to the first launch. Prefer explicit geographic relationships and
small configuration boundaries from the beginning.

### Full shared multi-tenant platform now

Would require operator isolation, provisioning, permissions, and potentially
billing decisions before the product needs them. Defer infrastructure
topology until independent-operator requirements are concrete.

### Commit to isolated deployments only

May be appropriate later, but prematurely rules out a multi-region app or
shared infrastructure. Preserve the reuse direction without selecting a
future operator-hosting model.

## Consequences

- Initial models and configuration must preserve portability without adding
  a generalized platform-management layer.
- Reused neighborhood/shop names across cities must not establish identity
  or cross-region associations. Validate geographic relationships during
  implementation.
- Before expansion, validate the model and discovery behavior with a second
  region, including overlapping names, per the roadmap. Before any shared
  operator hosting, separately design and verify authorization/isolation.
- No additional city dataset, region UI, branding editor, tenant model,
  license system, or deployment is introduced by this retrospective record.

## References

- [Roadmap expansion and white-label direction](../../ROADMAP.md)
- [Public application foundation](0011-public-application-foundation.md)
- [Geographic label relationships](0007-curated-neighborhood-labels.md)
- [Current admin authorization](0010-email-code-admin-access.md)
