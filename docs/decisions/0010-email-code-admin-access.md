# 0010: Use invite-only email codes with owner-approved admin access

## Status

Accepted on 2026-11-09. Related work: [#51](https://github.com/broffis/clt-coffee-map/issues/51).

The policy is accepted; production configuration, recovery, and access
revocation have not been implemented or tested.

## Context

The project owner prefers passwordless email-code sign-in through Clerk and
invite-only enrollment. Editing permission must be approved per user, with
easy revocation and the ability to block future access.

An authenticated or invited user is not automatically an authorized editor.
The admin app also contains private suggestions and visitor contact details,
so withdrawing access must protect reads as well as writes.

## Decision

### Sign-in and enrollment

Use Clerk email verification codes for admin sign-in. Do not enable passwords,
social sign-in, or other fallback methods without a separate reviewed decision.
Use Clerk's prebuilt authentication components where practical.

Use invite-only enrollment. Accepting an invitation or completing an email
challenge establishes identity, not permission to access private data or edit
shops. Keep the public directory and visitor submissions account-free.

Evaluate Clerk Hobby for production. Continue the previously accepted
no-Clerk-MFA-for-now posture, with the risk and upgrade triggers below.
Clerk sends authentication codes; no separate application email provider is
selected by this decision.

### Approval and access management

Only the project owner may invite users and approve, revoke, block, or restore
application access initially. Approved editors do not gain access-management
authority. Do not build generalized multi-operator roles for this MVP.

Provide straightforward owner-only access controls in the admin app, with
clear per-user status and explicit approve, revoke, block, and restore actions.
Enrollment and application permission changes remain distinct operations.

Keep authorization state private and server-managed, keyed by stable Clerk
user IDs. Default to denied unless explicitly approved. Do not grant privileges
from an email/domain match, possession of an invitation, successful login, or
user-editable profile metadata. Define the authoritative storage and trusted
initial-owner bootstrap during implementation.

Require a valid Clerk session and current authorization for every privileged
server operation, including private page/data reads, inbox access, shop edits,
uploads, publication actions, and access management. Only the owner may invoke
access-management operations, regardless of what controls the browser displays.

Revoking access removes all private admin access, including inbox reads and
editing. Blocking persistently denies future private access until the owner
explicitly restores it. A new code, session, invitation, or recreated account
must not automatically restore permissions; a different Clerk user ID starts
unapproved.

After an access change is successfully saved, subsequent privileged requests
must respect it even if the user already has an active session. Do not rely
only on UI state, session expiry, or stale approval claims in a token.
Enforce current authorization at server operation boundaries; do not imply
that revocation retracts data already delivered or cancels committed changes.
If authorization cannot be verified, deny the operation with an explicit error.

Application blocking must not depend on Clerk's paid user-ban feature. It
denies access to this app's private resources; it does not promise that Clerk
itself refuses to authenticate the email address. Session revocation can
provide additional sign-out behavior but is not a substitute for application
authorization.

Record access changes with actor, target user ID, action, and timestamp in
private audit records. Show persistence failures explicitly rather than
reporting a successful revocation or approval that was not saved.

### Recovery and owner continuity

Email-code sign-in has no application password to reset. Continued access to
the mailbox is the normal sign-in/recovery dependency. Recommend protecting
that mailbox with MFA and maintaining its recovery options, but do not claim
this enforces Clerk application-level MFA.

Before launch, define and test a trusted owner bootstrap and out-of-band
recovery procedure for lost mailbox access or owner lockout. Protect routine
access-management actions against accidentally removing the only owner's
access. Do not create a public recovery bypass or automatically transfer
approval to a replacement account based on email alone.

Loss of mailbox access, restoration to a replacement identity, and suspected
compromise require independently verified owner action. Recovery must preserve
revocation/block decisions unless deliberately changed. Document session
revocation and restoration steps without putting credentials, OTPs, or recovery
secrets in repository files or logs.

### Cost and MFA review

Pricing reviewed on 2026-11-09 lists Hobby as free with 50,000 monthly retained
users per app, email codes, and a fixed seven-day session lifetime. Public
anonymous visitors do not need Clerk sessions. Recheck plan eligibility,
email delivery behavior, rate limits, and optional usage-based charges before
launch; this is not a guarantee of unlimited free service.

Clerk production MFA and passkeys require a paid plan. Pro currently lists
$25/month, or $20/month billed annually. Documented MFA options include
authenticator apps, SMS, and backup codes; SMS has usage charges. Discuss
recurring costs before any upgrade. Development availability does not prove a
feature is free in production.

Email compromise can grant access as an approved admin. Reevaluate MFA as
private data, editing responsibility, or risk grows. If selected later, plan
backup codes and verified recovery; resetting MFA alone does not revoke
existing sessions.

## Alternatives

### Email/password or social sign-in

Supported by Clerk, but not the chosen passwordless experience. Additional
sign-in paths add recovery and account-linking behavior to evaluate.

### Treat every invitation or login as approval

Simpler, but fails the explicit per-user permission and owner-only management
requirements. Client-side checks alone do not protect server operations.

### Rely only on Clerk bans or session revocation

Does not replace application authorization. Clerk user bans are listed as a
paid feature, and signing out a user alone does not prevent later sign-in.
Use persistent application permission decisions as the access boundary.

## Consequences

- The owner manages invitations and permissions; editors cannot delegate or
  restore access. A usable owner-recovery procedure is a launch requirement.
- Test valid, invalid, expired, and replayed codes; invite restrictions;
  successful login without approval; non-owner management attempts; and
  revocation/blocking across existing and new sessions.
- Test authorization failures, direct server calls, re-invitation/account
  recreation without inherited privileges, and owner recovery without a
  permission bypass. Verify actual production email delivery and configuration.
- No Clerk application, account, invitation, permission record, dependency,
  billing change, or authentication flow has been configured by this decision.
  The remaining launch checks in #51 are not complete.

## References

- [Clerk pricing](https://clerk.com/pricing)
- [Email codes and MFA options](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options)
- [Invite-only access and paid identifier allowlists](https://clerk.com/docs/guides/secure/restricting-access)
- [Session revocation](https://clerk.com/docs/reference/backend/sessions/revoke-session)
- [MFA recovery and reset limitations](https://clerk.com/docs/guides/secure/mfa-recovery)
- [Production deployment requirements](https://clerk.com/docs/guides/development/deployment/production)
