# 0008: Maintain opening hours manually with quarterly review

## Status

Accepted on 2026-11-09. Related work: [#51](https://github.com/broffis/clt-coffee-map/issues/51).

## Context

Visitors benefit from opening hours, but schedules change and stale hours
can mislead. The directory is manually curated, and no automated hours
provider has been selected. Maintaining a copied schedule creates an ongoing
verification responsibility.

## Decision

Have administrators manually maintain regular weekly hours when they can be
verified from the shop's own published information, preferably its website.
Record the source and an hours-specific last-verified date. Link to the shop's
own hours information so visitors can check for changes.

Review stored hours every three months and sooner when a change is reported
or discovered. Visitor corrections are review inputs, not authority to
publish; administrators verify them against a shop-controlled source before
updating the directory.

If hours cannot be verified, do not guess a schedule. Link to the shop's
information where available and clearly distinguish unknown hours from
confirmed closed days. Record an actual verification date, not merely the
date a record was saved or the public site rebuilt.

Present stored schedules as regular hours, not a guarantee of current
availability. Note that holidays or temporary changes may differ and direct
visitors to the shop for confirmation. This decision does not add a live
"open now" feature or automated synchronization.

Design schedule representation, editing UX, and any future special-hours
support during implementation. Preserve the ability to represent a shop's
verified schedule without forcing it into an inaccurate single interval;
validate applicable timezone and day-boundary behavior.

The quarterly cadence is a manual maintenance policy. It does not require
building a scheduler, notifications, or a reminder system now. Changes follow
the public publication workflow in
[ADR 0006](0006-vercel-prerendered-hosting.md); saving updated hours alone
does not establish that the public output has refreshed.

## Alternatives

### Link-only hours

Avoids maintaining a duplicate schedule but makes visitors leave the
directory to compare regular hours. Keep links as a fallback and verification
path rather than the only presentation when reliable hours are available.

### Automated third-party hours

Could reduce manual work, but needs provider evaluation, permission to store
and display the data, cost review, and reliability checks. Do not scrape or
add a provider integration under this decision.

## Consequences

- Administrators own quarterly verification and investigation of corrections.
  Staleness can occur between checks; do not imply continuous monitoring.
- No paid service or external hours API is introduced.
- Test unknown versus closed hours, verification metadata, and the supported
  schedule behavior during implementation. No shop hours or tooling have
  been added by this documentation decision.

## References

- [Architecture and curation work](https://github.com/broffis/clt-coffee-map/issues/51)
- [Prerendered publication boundary](0006-vercel-prerendered-hosting.md)
