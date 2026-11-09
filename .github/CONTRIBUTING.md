# Contributing

## Branches

- Do all work on a branch.
- Never make changes directly on `main`.

## Work tracking

Use one GitHub Project, backed by repository issues, as the authoritative
place for completed and remaining work. Track meaningful deliverables and
bugs as issues; keep smaller steps in their parent issue rather than creating
an issue for every edit.

Each issue should describe scope, acceptance criteria, blockers, and related
pull requests. Use these Project statuses:

- Backlog: captured but not yet ready to start.
- Ready: scope and acceptance criteria are clear and blockers are resolved.
- In progress: work has started.
- In review: a pull request is ready for review.
- Done: acceptance criteria are met and the related changes are merged.

At the start of a work session, read the relevant Project items and issues.
Update the item when work starts, reaches review, is completed, or becomes
blocked. Before ending the session, record verified progress, remaining work,
and blockers in the issue. Link implementation pull requests to their issues;
do not mark unmerged or unverified work Done.

Keep `ROADMAP.md` focused on product scope and technical direction, not a
duplicate task-status checklist. Session summaries provide context but do not
replace the Project as the work tracker. If GitHub access fails, report it
and identify any unsynchronized updates rather than claiming they were saved.

Project: [CLT Coffee Map](https://github.com/users/broffis/projects/1).
Use this existing tracker rather than creating another Project.

## Pull requests and merging

Every change to `main` must go through a pull request, receive at least one
independent approval, and pass all required CI checks before merging. There
are no exceptions to these requirements.

Use squash merges only. The pull request title must follow Conventional
Commits and be used as the squash commit subject so Release Please can
interpret the resulting history. Preserve any breaking-change explanation in
the squash commit body or footer.

These are contribution requirements; GitHub rules and CI enforcement still
need to be configured.

## Definition of done

Before a pull request is ready to merge:

- Explain what changed and why.
- For behavior changes, document the failing-test/passing-test TDD steps.
- List the validation commands actually run, their results, and any limitations
  or checks not performed.
- Update affected documentation and ADRs.
- Meet the review, CI, coverage, and accessibility requirements in this guide.

Documentation-only changes require appropriate document checks, not artificial
behavior tests.

## Commits

Use the Conventional Commits format:

```text
<type>(optional-scope): short imperative description
```

Use standard types such as `feat`, `fix`, `docs`, `chore`, `refactor`, `test`,
`build`, `ci`, `perf`, and `revert`. Mark breaking changes with `!` after the
type or scope and explain them in the commit body or footer.

### Incremental TDD commits

Commit in small, coherent pieces that show progress toward the feature,
rather than collecting the whole implementation into one large commit. For
behavior changes, each commit should capture a small completed TDD increment:
write and verify the failing test locally, implement the minimum passing code,
then commit the test and code together.

Describe the tested behavior, the observed failure, and the change that made
it pass in the commit body. Continue with further test/code increments as the
feature develops. Keep independent refactoring in separate passing commits.
Do not fabricate TDD evidence or commit deliberately failing checkpoints.

Every commit must pass the required CI checks, not just the final PR head.
When CI is configured, validate each commit in the PR rather than relying
solely on a passing check for the latest commit.

Squash merging preserves this progression in the PR history, not as separate
commits on `main`; summarize the completed behavior in the squash commit.

## Releases

Release Please is planned for the CI pipeline. Keep commit types and breaking
change annotations accurate so it can later prepare release pull requests,
changelogs, versions, and GitHub releases automatically.

Release Please pull requests follow the same independent approval, required
CI, and squash-merge rules as all other pull requests. There is no bot or
release exception.

## Testing and coverage

Follow strict, incremental test-driven development (TDD) for all behavior
changes:

1. Write a simple test for the smallest step toward the desired behavior.
   Run it and confirm it fails for the expected reason.
2. Write only enough production code to make that test pass, then run it to
   confirm it passes.
3. Extend or refine the test, or add the next small test, to move closer to
   the feature requirements. Confirm the new expectation fails before
   implementing it.
4. Repeat the failing-test/passing-code cycle until the desired outcome is
   covered and implemented. Preserve earlier behavior checks as the tests grow.
5. Refactor with tests passing, then rerun the affected tests.

Do not implement the feature first and add tests afterward. Meeting the
coverage threshold does not replace following this workflow.

Use a test pyramid appropriate to the risk of the change:

- Unit tests for isolated logic and data transformations.
- Integration tests for boundaries such as data access, authentication, and
  server behavior.
- End-to-end tests for critical public discovery and admin workflows.

CI must enforce at least **90% branch coverage** before a change can be
merged. Measure this repository-wide across all first-party application code
in the public and admin apps, including files not imported by tests; this is
not a per-file threshold.

Use the combined unit and integration test coverage report for this gate and
report the result in pull request CI. Require critical end-to-end flows to
pass separately. Exclude only generated code and TypeScript declaration
files from application coverage. Do not exclude difficult-to-test code or
add coverage-ignore directives merely to meet the threshold.

### Test reliability

Use deterministic fixtures and isolate test data between tests and runs.
Clean up data and resources created by tests. Never use production services
or credentials in tests. Mock external services in unit tests and use dedicated
test environments for integration and end-to-end tests.

Do not silently skip tests or use retries to turn flaky failures green.
Any temporary quarantine must be explicit, reviewed, and tracked with an
owner and removal deadline. Quarantine must not remove required critical-flow
coverage.

## Tooling and CI

Use pnpm as the sole package manager and commit `pnpm-lock.yaml` once
application tooling is introduced. Pin the pnpm version and use
frozen-lockfile installs in CI.

Use a supported Node.js LTS release, pinned at the major version level rather
than to a specific minor or patch. Keep the selected major consistent across
local development, CI, and deployment.

Use Node.js 24 LTS and pnpm 12.15.0 as declared in `.node-version` and the root
package manifest. Strict TypeScript, Biome formatting/linting, and
Vitest/Testing Library tests are configured for the separate public/admin
workspace apps. See [README.md](../README.md) for the actual local commands,
including one-test execution, generated files, and scaffold limitations.

CI must check formatting, linting, types, tests and coverage, and production
builds. Those local commands now exist; wiring workflows, critical E2E and
accessibility checks, and every-commit enforcement remains separate CI work.

## Secrets and environments

Document required environment-variable names in a committed `.env.example`
using safe placeholders only. Ignore local secret files; never commit real
credentials. Keep development, test, and production credentials separate.

Store CI and deployment secrets in the respective platform secret stores.
Keep server secrets out of browser bundles and logs.

## Dependencies

Use automated dependency-update pull requests for packages and CI actions.
Require normal review and CI checks; do not auto-merge dependency updates.
Include corresponding lockfile updates when package dependencies change.

Justify new dependencies and review maintenance, license compatibility,
security, browser bundle and runtime impact, and ongoing cost before adding
them. Dependency-update automation still needs to be configured.

Avoid Vercel-specific dependencies where practical. When introducing one,
document it in deployment documentation and explain it in the PR, including
its purpose, why a portable alternative was not chosen, affected boundaries,
cost or limits, and replacement/removal steps. This includes host adapters,
configuration, deployment hooks, and caching integrations, not just packages.
Use an ADR for significant provider lock-in or a change to the hosting
decision in [ADR 0006](../docs/decisions/0006-vercel-prerendered-hosting.md).

## Architecture decisions

Record significant technical choices in short, numbered Architecture
Decision Records (ADRs) under `docs/decisions/`, using names such as
`0001-document-database.md`. Include status, context, decision, alternatives,
and consequences. This applies to choices such as the database, hosting and
caching, map provider, admin framework, and authentication and authorization.

Update `ROADMAP.md` when product scope or technical direction changes. ADRs
preserve the rationale: supersede accepted decisions with a new ADR and link
the records rather than silently rewriting the original decision. Create
records when decisions are made, not for speculative choices.

## Data validation and boundaries

Validate every external input at runtime on the server, including admin forms
and visitor suggestions. Client-side validation improves usability but is not
a trust boundary. Verify the Clerk session and explicitly authorize the admin
account for every privileged operation.

Public reads must return only explicitly published shops through an
allowlisted public data shape. Keep drafts, suggestions, visitor contact
details, and future journal data private and separate from public shop reads.

Return explicit errors for invalid input and authorization failures without
leaking private details. Test rejected and unauthorized requests alongside
successful flows.

## Accessibility

Target WCAG 2.2 AA in both public and admin experiences. Provide keyboard
access, visible focus, semantic controls and labels, accessible validation
errors, and sufficient contrast. Keep a complete list-based alternative to
map discovery.

Validate affected flows with automated accessibility checks and manual
keyboard testing. Include screen-reader checks for new or substantially
changed critical flows. Automated checks alone do not establish conformance.
