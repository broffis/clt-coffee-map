# 0009: Deliver suggestions to a private admin inbox

## Status

Accepted on 2026-11-09. Related work: [#51](https://github.com/broffis/clt-coffee-map/issues/51).

## Context

Visitors can suggest shops and corrections without an account. Submissions
include contact information for follow-up and require administrator review;
they are not published shop records. The project needs a reliable place to
review suggestions without adding an email-delivery dependency initially.

The project owner also wants the option to automatically delete entries
after a certain age, but has not selected a retention period or deletion
policy.

## Decision

Store visitor submissions privately in MongoDB Atlas, separate from curated
shop records, and provide an inbox in the private admin app. Administrators
check this inbox manually. Do not send email notifications or add an email
provider initially.

Use the separate server-side submission path, with runtime validation and
abuse protection. A successful response must mean the submission was saved;
surface persistence failures rather than accepting a suggestion that is lost.
The anonymous submission path must not allow visitors to read the inbox or
edit curated shops.

Require a verified Clerk session and explicit administrator authorization
for inbox reads and privileged review actions. Keep submissions and visitor
contact details out of public shop reads, prerendered output, and shared
caches. Use `private, no-store` for sensitive inbox responses.

Administrators verify suggestions before applying changes to curated records.
Review does not automatically publish a shop or correction. Curated updates
follow the normal publication workflow in
[ADR 0006](0006-vercel-prerendered-hosting.md).

### Optional age-based cleanup

Preserve the ability to add automatic deletion of old inbox entries later.
Use server-recorded creation and review timestamps to support a future
policy, without assuming which timestamp will determine expiry.

Automatic deletion is not enabled or required at launch by this decision.
Before enabling it, explicitly agree:

- The retention period and whether age runs from submission, review, or
  another defined event.
- Which entries qualify, including whether unread or unresolved suggestions
  are protected from deletion.
- Whether deletion removes the whole submission or only specified personal
  data, and how administrators are informed of the behavior.
- The cleanup mechanism, verification, and failure handling, without an
  unnecessary Vercel-specific scheduler dependency.

Any inbox cleanup must leave independently curated shop records intact.
Account for retained copies in logs, exports, and backups when designing
retention; deleting a live record does not establish immediate erasure of
every copy. Document the actual policy in the visitor-facing privacy notice
before collecting submissions. Do not promise an exact deletion deadline
without verifying the chosen mechanism.

Detailed inbox UX, abuse controls, manual deletion, and launch retention
disclosures remain implementation work. The optional automatic-cleanup
policy needs an explicit decision before it is implemented or enabled.

## Alternatives

### Inbox with email notifications

Could reduce manual checking while retaining the inbox as the durable record.
Defer it until needed; it adds provider, cost, privacy, and delivery-failure
considerations. A future notification failure must not lose a saved entry.

### Email-only delivery

Uses an existing mailbox but makes review state and follow-up harder to
manage, and depends on mail delivery and spam filtering. Prefer a durable
private inbox as the review source.

## Consequences

- Administrators must check the inbox; there are no automatic arrival alerts.
- Submission storage adds no email-service dependency. It still requires a
  working server path, private storage, abuse protection, and authorized admin
  access.
- Test successful persistence, visible failures, rejected invalid input,
  unauthorized reads/actions, and separation from published output during
  implementation. Test cleanup eligibility and preservation of shop records
  if automatic cleanup is later selected.
- No inbox, submission data, deletion job, or external service has been
  provisioned by this documentation decision.

## References

- [Architecture and curation work](https://github.com/broffis/clt-coffee-map/issues/51)
- [Atlas storage decision](0001-mongodb-atlas.md)
- [Admin editor decision](0003-tanstack-admin-editor.md)
- [Publication and hosting boundary](0006-vercel-prerendered-hosting.md)
