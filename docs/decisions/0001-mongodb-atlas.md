# 0001: Use MongoDB Atlas for MVP shop storage

## Status

Accepted on 2026-11-09. Related work: [#51](https://github.com/broffis/clt-coffee-map/issues/51).

## Context

The MVP needs a document database for a manually curated Charlotte-first shop
directory. The public TanStack Start app serves published shop data, while a
separate private admin app uses Clerk and explicit server-side authorization
to manage entries. WordPress was previously ruled out for the MVP.

Priorities are low ongoing cost, non-technical editing, and data ownership
and portability. Prefer free tiers where practical and discuss any recurring
cost before proceeding. Photos will use separate storage; a database provider
does not itself resolve the admin editing workflow.

## Decision

Use MongoDB Atlas as the managed document database for MVP shop storage.
Favor its standard MongoDB data model and migration path between MongoDB
deployments over Firestore's more provider-specific query and data conventions.
This improves portability within the MongoDB ecosystem; migration to a
different database technology would still require work.

Evaluate the Atlas free tier first, but do not treat it as launch-approved
without validating capacity, hosting connectivity, availability, and backup
and restoration needs. This decision does not provision infrastructure,
select a paid tier, or authorize recurring costs.

Keep database access server-side. Public access must be read-only and expose
only published, allowlisted shop data. Admin operations must verify a Clerk
session and explicitly authorize the admin account. Credentials must not
reach browser code. Preserve stable shop/location IDs and explicit region
relationships, and keep map presentation separate from stored shop data.

## Alternatives

### Cloud Firestore

Firestore offers managed scaling and a free quota that may fit the initial
directory. However, its query/index conventions and managed export format
create more Google-specific coupling. Managed export/import and backups
require billing. Its browser-facing realtime capabilities are not an MVP
requirement, and using Clerk with server-side access would still require
application authorization; server libraries bypass Firestore Security Rules.

Firestore remains a viable alternative if future requirements or deployment
constraints justify superseding this decision.

### Self-managed MongoDB

Self-management retains MongoDB compatibility but adds database operations,
patching, monitoring, and backup responsibilities. Prefer managed Atlas for
the MVP rather than taking on those responsibilities now.

## Consequences

- Database provider selection is resolved; hosting, photo storage, admin
  editing, and the remaining MVP decisions are not.
- Validate the MongoDB driver, connection reuse, networking, credentials, and
  database region against the selected SSR and admin hosting environments.
- Atlas free storage is currently advertised as 512 MB on shared
  infrastructure. Recheck limits and paid upgrade costs before deployment;
  free capacity is not an availability guarantee.
- Define and test export and restoration before launch. The currently
  documented paid free-cluster backup feature is a private preview, so do not
  assume it is available or a free backup solution.
- Build the private editor separately and validate that administrators can
  maintain shops without code changes.
- Keep data and media exportable and verify restoration rather than relying
  on the provider choice alone for portability.

## References

Provider documentation reviewed on 2026-11-09; plans and features may change.

- [MongoDB Atlas pricing](https://www.mongodb.com/pricing)
- [Atlas free cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)
- [Atlas free cluster backups](https://www.mongodb.com/docs/atlas/backup/cloud-backup/free-cluster-backup/)
- [Firestore quotas](https://firebase.google.com/docs/firestore/quotas)
- [Firestore managed export/import](https://firebase.google.com/docs/firestore/manage-data/export-import)
- [Firestore server access and Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
