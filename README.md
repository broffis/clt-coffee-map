# CLT Coffee Map

Charlotte-first coffee discovery, built with separate public and admin
applications. This is a development scaffold, not a working shop directory or
an authenticated editor. Product scope is in [ROADMAP.md](ROADMAP.md), accepted
choices are in [the ADRs](docs/decisions/), and contribution requirements are in
[CONTRIBUTING.md](.github/CONTRIBUTING.md).

## Getting started

Use Node.js **24 LTS** (`.node-version`) and **pnpm 12.15.0**
(`package.json#packageManager`). Use a Node version manager and pnpm's
[installation instructions](https://pnpm.io/installation) if needed. No service
accounts, credentials, or environment variables are needed for this scaffold.

```sh
pnpm install --frozen-lockfile
pnpm dev:public
```

Public development runs at `http://127.0.0.1:3000`. In another terminal, run
`pnpm dev:admin` for the separate admin shell at `http://127.0.0.1:3001`.
Both commands fail if their port is occupied rather than silently switching.

## Workspace and boundaries

- `apps/public`: TanStack Start public app. The homepage is prerendered.
- `apps/admin`: independent TanStack Start app with a nonprivileged placeholder.
  Clerk, private data, editing, and TanStack Form integration belong to later work.
- `static`: existing public assets, served by the public app; the original logo
  remains at `static/images/logos/CLTCOFFEE.png`.
- `tests/setup.ts`: isolated DOM test setup, including cleanup and a jsdom
  scroll stub. Tests use memory routing and do not load either app's Vite
  configuration or require live services.

Each app owns its router types and TypeScript project. There is no shared
application package until something actually needs sharing. Tool configuration
and testing dependencies live at the workspace root.

The admin shell is **not an authorization implementation**. It exposes no private
records, forms, or server operations. A `noindex` directive is not access control.
Do not add private behavior until server-side session and current permission
checks are implemented.

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

Branch CI is being implemented in #53. `branch.yml` runs formatting, lint, types,
coverage tests, and both production builds for pull requests and merge groups.
Its PR-only `PR title` job checks Conventional Commit syntax, including optional
scopes and breaking-change
`!` markers, and reruns when a PR title is edited. The MIT-licensed
`amannn/action-semantic-pull-request@v6` provides the parser without adding an
application dependency; it reads current PR metadata with a read-only token and
does not check out source. It can be replaced by another Conventional Commits
validator. Actions use mutable major-version tags.

Workflow execution still needs verification on GitHub. Every-commit validation,
the remaining checks, E2E/browser accessibility tests, and release automation
are not implemented yet. #50 must require verified checks and enforce use of
the PR title as the squash commit subject; a title check alone does not ensure
the merged commit uses it. Unit/integration DOM checks do not replace production,
keyboard, screen-reader, or critical-flow validation.

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
`pnpm licenses list` inventories transitive licenses as well. There are no paid
services or additional client UI packages.
Dependencies are pinned and transitive resolution is captured in
`pnpm-lock.yaml`; updates require normal review and validation.

pnpm generated exact-version release-age exceptions for the initial Vite,
React plugin, Rolldown, and platform binding versions in `pnpm-workspace.yaml`.
`minimumReleaseAgeStrict` requires review before adding further exceptions;
these entries do not approve arbitrary future versions.

`.env.example` documents that no variables are currently required. Add actual
names with safe placeholders alongside each integration rather than inventing
unused credentials. If needed later, app-local `.env.local` files stay ignored;
never put database, storage, or Clerk secrets in `VITE_` variables, client
modules, prerendered output, or logs. Keep dev/test/preview/production resources
and credentials separate. Service-backed tests must use dedicated nonproduction
resources; the scaffold itself needs none.
