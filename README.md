# CLT Coffee Map

Charlotte-first coffee discovery, built with separate public and admin
applications. This is a development scaffold, not a working shop directory or
an authenticated editor. Product scope is in [ROADMAP.md](ROADMAP.md), accepted
choices are in [the ADRs](docs/decisions/), and contribution requirements are in
[CONTRIBUTING.md](.github/CONTRIBUTING.md).

## Getting started

Use Node.js **24 LTS** (`.node-version`) and **pnpm 12.15.0**
(`package.json#packageManager`). Use a Node version manager and pnpm's
[installation instructions](https://pnpm.io/installation) if needed. Public
development and automated tests need no service credentials. Admin sign-in
requires the Clerk development keys described below.

```sh
pnpm install --frozen-lockfile
pnpm dev:public
```

Public development runs at `http://127.0.0.1:3000`. In another terminal, run
`pnpm dev:admin` for the separate admin shell at `http://127.0.0.1:3001`.
Both commands fail if their port is occupied rather than silently switching.

## Workspace and boundaries

- `apps/public`: TanStack Start public app. The homepage is prerendered.
- `apps/admin`: independent TanStack Start app with Clerk sign-in and a
  server-authorized access-check endpoint. Shop editing and TanStack Form
  integration are not implemented.
- `static`: existing public assets, served by the public app; the original logo
  remains at `static/images/logos/CLTCOFFEE.png`.
- `tests/setup.ts`: isolated DOM test setup, including cleanup and a jsdom
  scroll stub. Tests use memory routing and do not load either app's Vite
  configuration or require live services.

Each app owns its router types and TypeScript project. There is no shared
application package until something actually needs sharing. Tool configuration
and testing dependencies live at the workspace root.

The admin homepage exposes no private shop records or editing operations.
The access-check endpoint enforces the server session and current application
permissions; a `noindex` directive or client-side sign-in component is not an
authorization boundary. Every future private operation must enforce those
checks independently.

## Local checks

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `pnpm format:check` | Check source/config formatting with Biome |
| `pnpm format` | Apply source/config formatting |
| `pnpm lint` | Run Biome's recommended lint rules |
| `pnpm typecheck` | Check root tooling and each app with strict TypeScript |
| `pnpm test` | Run all unit/integration tests once |
| `pnpm test apps/public/tests/app.test.tsx` | Run one test file |
| `pnpm test apps/public/tests/app.test.tsx -t "account-free"` | Run one named test |
| `pnpm test:watch` | Watch unit/integration tests |
| `pnpm test:coverage` | Combined unit/integration coverage with a 90% branch gate |
| `pnpm build` | Build both apps and prerender the public homepage |

Coverage includes all first-party `apps/*/src/**/*.{ts,tsx}`, even unimported
files; only generated route trees and declarations are excluded. The initial
shells contain no conditional branches, so a passing branch gate is not proof
that future discovery, editing, or authorization behavior is covered.

Keep generated `src/routeTree.gen.ts` files in version control so types and tests
work immediately after installation. Start regenerates them during dev/build; do not
edit them by hand. Biome ignores generated trees and the package-manager lockfile.
Biome currently formats/lints source and configuration, not Markdown or assets.
The app-specific Release Please manifests are excluded from formatting because
they are generated; Biome still lints them.

Branch CI is being implemented in #53. `branch.yml` runs formatting, lint, types,
coverage tests, and both production builds for pull requests and merge groups.
It checks the latest PR update's proposed merge snapshot, not each intermediate
commit. New updates cancel superseded runs for the same PR; other PRs and
merge-group refs have separate concurrency groups.
Its PR-only `PR title` job checks Conventional Commit syntax, including optional
scopes and breaking-change
`!` markers, and reruns when a PR title is edited. The MIT-licensed
`amannn/action-semantic-pull-request@v6` provides the parser without adding an
application dependency; it reads current PR metadata with a read-only token and
does not check out source. It can be replaced by another Conventional Commits
validator. Actions use mutable major-version tags.

`main.yml` repeats validation, coverage tests, and both production builds for
the merged commit on pushes to `main`. Only after all three jobs succeed does
it call `release.yml`. Main and release runs are not canceled by newer pushes,
to avoid interrupting release operations. Neither workflow deploys the applications.

Workflow execution still needs verification on GitHub. E2E/browser accessibility
tests are not implemented yet. #50 must require verified checks and enforce use of
the PR title as the squash commit subject; a title check alone does not ensure
the merged commit uses it. Unit/integration DOM checks do not replace production,
keyboard, screen-reader, or critical-flow validation.

## Dependency updates

`.github/dependabot.yml` schedules weekly version-update checks for the pnpm
workspace and GitHub Actions. The `npm` ecosystem entry at `/` covers the root
and both workspace apps with their shared lockfile; the `github-actions` entry
at `/` covers workflow Action references. Package PRs use `chore(deps)` and
Action PRs use `ci(deps)` Conventional Commit prefixes. Keep Action references
on major tags. Update PRs require normal independent review, CI, and squash
merging; no auto-merge, bot bypass, or release App credentials are configured.
Review related package versions together and retain Node 24 and frozen-lockfile
compatibility rather than bypassing failed checks or pnpm's release-age policy.

[GitHub documents pnpm 12 version-update support](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories#pnpm),
but the current two-document `pnpm-lock.yaml` is not detected by its dependency
graph. Dependabot alerts and security-update PRs are therefore not created for
those lockfile dependencies. Weekly version updates do not replace vulnerability
checks; use `pnpm audit` and review advisories.

Dependabot is GitHub-hosted and adds no application package or paid service;
runner usage and platform limits still apply. The configuration takes effect
on the default branch, and the first update job/PR must verify workspace
discovery, lockfile regeneration, title validation, and CI on GitHub. To remove
or replace it, remove `.github/dependabot.yml` and configure the replacement
updater; manifests and lockfiles remain standard pnpm files.

## Releases

Release Please prepares independent release PRs, versions, and app-local
`CHANGELOG.md` files for `apps/public` and `apps/admin`. Each app's first
intended release is **0.1.0**, with distinct tags such as `public-v0.1.0` and
`admin-v0.1.0`. Each app has its own `release-please-config.json` and
`.release-please-manifest.json`; empty initial manifests mean neither app has
a recorded release. The Node release strategy adds package versions and
changelogs in the release PRs; these private apps are not published to npm.
Root-only tooling changes do not automatically release both apps.

The workflow processes the apps sequentially. `always-update` ensures existing
release PRs are regenerated when their configuration or manifest path changes,
even if their release notes do not. This may update open release PRs on later
main pushes; remove it from both configs after verifying the migration if that
churn is undesirable. Before merging release PRs, verify that each updates
only its own app-local manifest, not the old shared manifest.

`release.yml` is reusable-only and is called after successful main validation,
tests, and builds. It prepares release PRs from Conventional Commits and creates
tags/GitHub releases after release PRs merge. Release PRs still need independent
approval, normal CI, and squash merging without bypass. Review the initial
changelog contents before the first release.

The workflow uses a dedicated GitHub App, installed only on this repository,
with **Contents**, **Issues**, and **Pull requests** read/write permissions.
Store its non-secret Client ID in the Actions repository variable
`RELEASE_APP_CLIENT_ID` and its PEM private key in the Actions repository secret
`RELEASE_APP_PRIVATE_KEY`. These are CI settings, not application environment
variables; never put the key in `.env.example`, source, logs, or PR workflows.

The MIT-licensed `actions/create-github-app-token@v3` mints a short-lived token,
explicitly limited to this repository and those three permissions, and revokes
it after the job. The `client-id` input uses the App's Client ID, not its numeric
App ID. The Apache-2.0
`googleapis/release-please-action@v5` uses the token so its PRs trigger normal CI,
unlike PRs created using the default `GITHUB_TOKEN`. The default workflow token
remains read-only, and release automation never checks out application source.

App registration/token generation does not require a paid release service;
workflow runner usage and GitHub API limits still apply. Protect and rotate the
private key, remove superseded App keys, and revoke the installation/key if
compromised. Do not grant the App ruleset bypass rights. To disable automation,
remove the main workflow's release call and revoke its credentials. The versions,
changelogs, and tags remain usable with replacement release tooling.

These workflows take effect only after review and merge. Credential presence
does not prove authentication or correct installation permissions; the first
GitHub execution must verify token creation, normal release-PR CI, and release
behavior. No deployment or successful release is claimed by local checks.

## Builds and portability

The public app writes static output to `apps/public/dist/client`, including
`index.html` and the existing public assets. You can check that output without
running an application backend:

```sh
python3 -m http.server 4310 --bind 127.0.0.1 --directory apps/public/dist/client
```

Visit `http://127.0.0.1:4310` and stop the server with Ctrl-C when finished.
Python is only an optional smoke-check server, not an application dependency.
Only `/` exists today; no shop snapshots, detail routes, filtering, PWA manifest,
map, or publication pipeline are implemented.

Prerendering is explicit and fails the build on errors, without retries or
automatic link crawling. Add published routes deliberately when implementing
discovery and the publication policy in #55. The admin app does not prerender.
Both builds also emit `dist/server` artifacts; these are not a ready-to-run
production Node server or a validated Vercel deployment.

No hosting adapter or Vercel-specific dependency/configuration is introduced.
Deployment integration and runtime limits still need validation. Follow
[ADR 0006](docs/decisions/0006-vercel-prerendered-hosting.md) and document every
Vercel exception when introduced. Required launch checks remain in #57.

## Dependencies and environments

React, Router, and Start supply the agreed application foundation. Vite and its
React plugin provide builds; TypeScript checks types. Biome covers source
formatting/linting without separate formatter/linter stacks. Vitest, its V8
coverage provider, Testing Library, and jsdom supply isolated tests. These
direct dependencies use MIT or Apache-2.0 licenses (Biome offers either);
`pnpm licenses list` inventories transitive licenses as well. No paid service
plan is configured by the source code.

The admin sign-in integration uses the official MIT-licensed
`@clerk/tanstack-react-start` adapter, pinned to 1.7.13. Its maintained Clerk
React components and Start middleware handle sign-in and session transport
rather than a custom email-code implementation. Its transitive backend SDK
stays server-side. This adds client JavaScript
and Clerk-hosted UI/network dependencies to the admin app only; the public
app must not import it. Measure the built bundle and verify production costs,
email delivery, and runtime compatibility before launch. The initial local
admin client build increased from 109.26 kB to 144.92 kB gzip; Clerk's separately
loaded hosted assets and runtime requests are additional. The package license
does not make the hosted service unlimited or free. To remove it, replace the
provider, sign-in controls, and middleware with another identity adapter while
retaining application permission checks and existing Clerk-ID access records
until an explicit identity migration is performed.

The shop editor form uses MIT-licensed `@tanstack/react-form`, pinned to 1.33.5
as selected in ADR 0003; it adds three small TanStack packages. It adds about
14.7 kB gzip to the admin client (144.92 kB to 159.61 kB, measured locally with
the editor form) and nothing to the public app. It manages field state and
submission only; the server remains the validator and authorizer. To remove it,
replace `ShopDraftForm` state handling with plain React state, keeping the
server validation, error display, and unsaved-change warning unchanged.

`requireRequestPermission` verifies the incoming request's session before
checking the verified user's current application permissions. It never grants
access on sign-in or accepts an actor ID from request parameters.

The admin homepage offers Clerk sign-in and a read-only **Check admin access**
action. `GET /api/admin/access` uses Clerk's server middleware and reads the
current access record from Atlas. It returns 401 without a session, 403 without
approval, or 503 if permissions cannot be verified; responses use
`Cache-Control: private, no-store`. The homepage contains no private shop data
or editing operations, and a successful sign-in never bootstraps an owner.

For local development, put `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in
`apps/admin/.env.local` (gitignored). Vite loads only the named server settings
into the server process, without defining them in browser code. The provider
receives the publishable key through Clerk's public SSR state; the secret key
must never be prefixed with `VITE_` or sent to the browser. The access check
also requires `MONGODB_URI` and `MONGODB_DB_NAME`; without Atlas configuration
it reports unavailable permissions, not successful access or an unapproved
account. No database or Clerk account is created automatically.

Saving shop drafts (`POST /api/admin/shops`) uses separate editor credentials,
`MONGODB_WRITE_URI` and `MONGODB_WRITE_DB_NAME`, which never fall back to the
read-only variables. Create a dedicated Atlas user limited to read/write on the
shop and location collections; access records stay read-only through
`MONGODB_URI`. Without them, saving reports the editor as unavailable. Drafts
are never published by this endpoint. The server generates shop IDs; a
request-supplied ID may only edit an existing shop and is otherwise rejected.
Locations are saved with `POST /api/admin/locations` and listed with
`GET /api/admin/shops` (requires `private:read`), which return draft values only.
The editor's core location fields are shop, type, street address, postal code,
coordinates and a location website; hours and details are not yet editable.
The server generates location IDs and applies the region and city from
`DEFAULT_REGION_ID` and `DEFAULT_CITY_ID` (never from the client) when it
creates a location. If either is missing, creating a location reports the
editor as unavailable; editing existing locations keeps their region and city.
The editor user needs no privileges beyond the shop and location collections.
State-changing requests to admin route handlers (not only server functions)
must pass origin validation: requests that are cross-site, from another
origin, or without `Sec-Fetch-Site`/`Origin`/`Referer` headers are rejected
with 403.
In development, Clerk session authorized parties are limited to
`http://127.0.0.1:3001` and `http://localhost:3001`. Outside development,
`ADMIN_ORIGIN` must specify the exact HTTP(S) admin origin, without a path,
query, or trailing slash. The origin is configuration, never inferred from
request headers. Configure email-code sign-in and Invite-only in the Clerk
Dashboard; source code alone does not verify those provider settings.

### Development verification (2026-11-18)

The following checks used the development Clerk application and Atlas database,
not a production deployment. Browser and dashboard results were reported by the
operator; they are not automated end-to-end tests. No addresses, user IDs,
invitation links, codes, or credentials are recorded here.

| Check | Evidence |
| --- | --- |
| Authentication settings | Invite-only; email verification codes enabled; email links, passwords, phone/SMS, passkeys, and social/enterprise connections disabled in the dashboard. |
| Email sign-in | A real code email arrived; an altered code was rejected while signed out; the correct code signed in and the access check allowed the owner. |
| Expired code | The original code was rejected after waiting at least 11 minutes without resending; a new code restored owner access. |
| Used code in a new challenge | Within five minutes, a previously used code was rejected in a new sign-in challenge; the latest code restored access. This is not a same-attempt protocol replay test. |
| Uninvited enrollment | The hosted sign-up page, opened signed out without an invitation, required an invitation and blocked sign-up. The portal link was under the dashboard's Configure tab. |
| Invited enrollment | A separate test account received an invitation, enrolled, signed in locally, and remained unapproved. No application permission was granted to it. |
| Owner persistence and access | Read-only Atlas checks found one approved owner and its matching bootstrap audit entry; the operator confirmed allowed owner access. Temporary bootstrap credentials were removed afterward. |
| Unsigned requests | Local HTTP checks returned 401 with `private, no-store` from the access endpoint; the sign-in homepage remained available. |

Live Clerk session revocation was explicitly deferred on 2026-11-18 after the
dashboard control could not be located. No session was revoked, and no
revocation helper was added. Live Atlas-backed application revocation/blocking
across existing and new sessions is also unverified: the test account has not
been approved, revoked, or blocked. Credential-free request-authorization tests
cover denial after current permission records change, not those live workflows.
Keep the only owner's access intact when completing these checks.

Before launch, verify production configuration and delivery, same-attempt code
replay behavior, revocation/blocking, and owner recovery. Review existing users'
authentication methods as well: Clerk documents that disabling passwords does
not remove an existing user's password sign-in capability. Dashboard settings
alone do not establish that every existing account is email-code-only.
These results do not establish production authorization or accessibility.
See [ADR 0010](docs/decisions/0010-email-code-admin-access.md) for the current
pricing review and remaining cost checks.

### Trusted initial owner setup

The local-only `pnpm admin:bootstrap-owner` command defaults to a read-only
preflight. It is not a web endpoint, sign-in hook, or recovery mechanism. Use it
only against the intended development database after independently checking the
target user in the matching Clerk development application's dashboard.
The command does not query Clerk or infer ownership from an email address.

Keep the running application's Atlas credentials read-only. Create a separate
temporary database user with `readWrite` on only the development database,
restricted to the intended cluster and current IP. In the ignored
`apps/admin/.env.bootstrap.local`, set:

```dotenv
BOOTSTRAP_MONGODB_URI="completed-Atlas-URI-for-the-temporary-user"
BOOTSTRAP_MONGODB_DB_NAME="your-development-database"
BOOTSTRAP_CLERK_USER_ID="user_copy-the-exact-development-user-id"
```

Never paste this file, the URI, or passwords into chat or logs. Preserve Atlas
URI options and percent-encode password special characters. Bootstrap settings
are separate from `apps/admin/.env.local`; the web app does not load them.

Run `pnpm admin:bootstrap-owner` from the root to check without writing.
After reviewing the intended development database and Clerk user, run
`pnpm admin:bootstrap-owner --apply` in your own interactive terminal and type
the exact target user ID when prompted. No credentials belong in CLI arguments.
The command uses Node 24's native TypeScript support; explicit `.ts` imports in
its dependency chain are necessary for execution without another runner.

The write uses a MongoDB transaction with majority write concern to commit the
owner and private audit entry together. A fixed audit `_id` serializes competing
invocations of this command, even for different target IDs. It refuses to run
if any owner exists (including revoked/blocked), the target already has an
access record, or its bootstrap audit marker already exists. It never replaces
access decisions. Keep that audit marker; do not delete records to rerun setup.
Transactions must be supported by the selected deployment; there is no
nontransactional fallback. A connection/commit error is not proof of failure:
inspect both records before retrying an unconfirmed outcome.

After a confirmed commit, delete the temporary Atlas user and local bootstrap
file, then check access through the still-read-only admin app. This path does
not repair the older access-management service's separate audit/save operations,
timestamp conflict checks, cross-process last-owner checks, or owner recovery.
Do not invoke its legacy `bootstrapOwner` helper as an alternative setup path.
A single development bootstrap has been verified. Concurrent transaction
behavior and owner recovery still require verification before production use.

The admin and public apps use the official `mongodb` driver (Apache-2.0;
transitive packages are MIT, Apache-2.0, BSD-2-Clause, or Unlicense) for
server-only Atlas persistence per
[ADR 0001](docs/decisions/0001-mongodb-atlas.md). The admin adapter is used
behind repository interfaces in `apps/admin/src/persistence`; the public adapter
is a read-only published projection in `apps/public/src/public-data`. Neither
may be imported from browser code. This adds no paid service; Atlas tier and
cost decisions remain separate. To replace it, implement equivalent adapters
behind the app boundaries and remove the package. An ODM was not chosen because
validation already lives in the domain layer.

Dependencies are pinned and transitive resolution is captured in
`pnpm-lock.yaml`; updates require normal review and validation.

pnpm generated exact-version release-age exceptions for the initial Vite,
React plugin, Rolldown, and platform binding versions in `pnpm-workspace.yaml`.
`minimumReleaseAgeStrict` requires review before adding further exceptions;
these entries do not approve arbitrary future versions.

`.env.example` documents the current integration variables with safe
placeholders. App-local `.env.local` and `.env.bootstrap.local` files stay ignored;
never put database, storage, or Clerk secrets in `VITE_` variables, client
modules, prerendered output, or logs. Keep dev/test/preview/production resources
and credentials separate. Service-backed tests must use dedicated nonproduction
resources; the scaffold itself needs none.
