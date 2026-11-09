# 0006: Start on Vercel with portable prerendered public content

## Status

Accepted on 2026-11-09. Related work: [#51](https://github.com/broffis/clt-coffee-map/issues/51).

## Context

The public directory needs useful shop HTML without depending on map
JavaScript or a database query for every visit. The project owner requires
prerendering and wants to avoid Vercel dependencies where practical. Any
Vercel-specific dependency introduced must be documented.

The separate admin editor still needs server operations for authorized Atlas
writes and R2 upload processing. Visitor submissions also need a server path;
static hosting alone cannot supply these capabilities.

## Decision

Use Vercel initially for the public TanStack Start app and the separate private
admin app, as separate projects. Evaluate Hobby for the personal,
non-commercial project, subject to eligibility and deployment validation.
This does not provision services, enable billing, or authorize paid upgrades.

### Public rendering and publication

Require prerendered HTML for public directory and shop-detail content, with
an allowlisted, published-only data snapshot for discovery. Keep map loading
separate and map/list filtering consistent. Do not prerender private admin
content, drafts, submissions, visitor contact details, or credentials.

Keep public discovery capable of static hosting: verify initial HTML,
direct shop URLs, browser navigation, filtering, and map data without relying
on Vercel server functions for directory reads. Prerendering some routes does
not by itself prove the application is fully static. Explicit submission
requests remain separate backend operations.

Publishing directory changes requires regenerating and deploying the affected
public output and handling cached content, not merely saving an Atlas record.
Distinguish a saved edit from a publicly deployed change, and surface
publication failures. Design and test the publication workflow during
implementation, including unpublishing and consistent list/detail/map data.

Cache versioned public assets with standard HTTP headers and use changed
URLs when asset content changes. Public HTML and data freshness targets,
cache durations, deployment triggers, invalidation, and outage behavior remain
open; agree these before implementing publication. Do not promise immediate
visibility or removal without validating every relevant cache.

Do not use shared caching for sensitive admin or submission responses; use
`private, no-store`. Stadia tile caching follows its own terms. Offline and
service-worker features remain deferred.

### Avoid and document provider dependencies

Prefer standard web APIs, ordinary Node.js server code, portable static
output, and HTTP caching over Vercel-specific application services.
Keep Atlas, R2, Clerk, and Stadia independent of the hosting provider.
Do not add Vercel storage, image delivery, proprietary regeneration, or other
provider services merely because they are available.

Keep necessary host adapters, configuration, deployment triggers, environment
assumptions, and cache-management integrations at the deployment boundary.
Do not build an elaborate multi-host abstraction or automatic failover.

Document every Vercel-specific dependency in deployment documentation when it
is introduced, including configuration and integrations, not just packages.
Record its purpose, why a portable alternative was not chosen, affected
boundaries, cost or limits, and how to replace or remove it when migrating.
Explain it in the introducing PR; use an ADR for significant lock-in or a
change to this decision. No Vercel-specific implementation dependencies have
been added by this documentation decision.

### Server runtime and migration

Use a Node.js deployment path for server operations, consistent with the
repository's selected supported Node LTS major. Confirm Start adapter support,
Atlas network access and connection reuse, Clerk authorization, R2 access,
and upload-time resizing within actual runtime limits before launch.

The public static site and admin/backend can migrate independently. Rebuild
for the destination host rather than expecting Vercel server output to run
unchanged. A static-site move should mostly affect deployment, routing,
headers, publication integration, and DNS. Moving server operations also
requires runtime, secrets, networking, and integration validation.

## Alternatives

### Cloudflare

Static hosting remains a candidate for the prerendered public output.
Moving the backend to Workers is a separate decision: Workers is not an
ordinary Node runtime, and Atlas connectivity and image processing require
validation. The free plan's 10 ms CPU allowance per invocation is not a
guarantee that the complete backend fits. Paid Workers starts at $5/month
plus applicable usage under the pricing reviewed on 2026-11-09.

### Netlify

Start has a documented deployment integration. Netlify remains a candidate
for static delivery and server hosting, with destination-specific validation.
The reviewed free plan pools 300 monthly credits across deployments, compute,
bandwidth, and requests; production deployments consume 15 credits each.
Personal starts at $9/month. Recheck terms and costs before a move.

### S3, CloudFront, and Route 53

Viable for static public output. Route 53 supplies DNS, not application
routing or compute. CloudFront can supply HTTPS and CDN delivery from a
private S3 origin; direct S3 website endpoints do not support HTTPS.
Admin, image processing, and submissions still require a backend. This adds
AWS deployment and cache-management work; no AWS pricing or integration has
been validated for this application.

### Other Node.js hosts

Start documents Node.js/Docker deployment, preserving a conventional server
alternative. Evaluate operating effort, availability, regions, and cost if
Vercel no longer meets requirements.

## Consequences

- Vercel Hobby is restricted to personal, non-commercial use. Pricing reviewed
  on 2026-11-09 includes 1 million monthly function invocations and 100 GB
  transfer; multiple projects do not imply independent allowance pools.
  Exceeding free limits can interrupt service. Pro starts at $20/month plus
  applicable usage; discuss recurring costs before upgrading.
- Prerendering reduces public database dependence, but moves freshness and
  failure handling into the publication pipeline. Admin and submission
  availability remain dependent on server services.
- Provider portability is a design and verification requirement, not a claim
  that any migration is automatic or already tested.
- Verify public output contains only intended published fields and works on
  a static server. Test runtime integrations and publication/cache behavior
  before launch. No deployment, compatibility, or performance tests have run.
- Reevaluate the host if eligibility, quotas, cost, reliability, runtime
  compatibility, or maintenance needs change; record a replacement in a
  superseding ADR.

## References

- [TanStack Start static prerendering](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering)
- [TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Vercel pricing](https://vercel.com/pricing)
- [Vercel function limits](https://vercel.com/docs/functions/limitations)
- [Vercel cache-control headers](https://vercel.com/docs/caching/cache-control-headers)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Netlify pricing](https://www.netlify.com/pricing/)
- [S3 website endpoints](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteEndpoints.html)
- [Private S3 origins with CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
