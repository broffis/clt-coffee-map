# 0013: Use Tigris S3-compatible storage for shop photos

## Status

Accepted on 2026-11-20. Related work: [#72](https://github.com/broffis/clt-coffee-map/issues/72).

Supersedes [ADR 0002](0002-r2-photo-storage.md) for the object-storage
provider only. The upload-time resizing, authorization, and
reference-storage decisions in ADR 0002 remain in force.

## Context

ADR 0002 selected Cloudflare R2 before any bucket was provisioned. Before
starting the photo pipeline, we compared S3-compatible alternatives that keep
costs low and media exportable. Cloudflare Images and Ente were also considered;
Cloudflare Images is a paid hosted service, and Ente is an end-to-end encrypted
personal backup service that cannot serve public images.

Provider documentation was reviewed on 2026-11-20:

- Tigris offers a stable, documented S3-compatible API, a monthly free tier
  (5 GB Standard storage, 10,000 Class A and 100,000 Class B requests), free
  egress, Standard storage at $0.02/GB-month, public buckets, and custom
  domains. Public buckets require payment-method verification for
  organizations created after 2026-05-18, with no extra charge.
- Bunny Storage costs $0.01/GB-month (HDD, one region) with CDN delivery billed
  separately, a $1 monthly minimum, and only a 14-day trial. Its S3 API is a
  public preview that can be enabled only when creating a storage zone, and its
  CDN does not yet apply stored S3 metadata such as `Cache-Control`.

## Decision

Use Tigris Standard storage for MVP shop photos instead of Cloudflare R2.

Access storage only through the standard S3 API behind a small application
storage interface (put, delete, public URL). Keep provider endpoints and
credentials server-side configuration, and avoid Tigris-specific SDK features
so the provider remains replaceable by any S3-compatible store.

Keep the ADR 0002 requirements: resize and validate images during the upload
workflow, finish processing before publication, surface failures to the
administrator, authorize uploads through server operations that verify the
Clerk session and explicit admin permission, keep unprocessed uploads private,
and store stable photo IDs and object keys (not URLs or image bytes) in Atlas.

Resizing stays in our application at upload time. Do not depend on
provider-side transformation or optimization services.

This decision does not provision a bucket, add a payment method, or authorize
recurring costs. Discuss the card verification required for public buckets
before creating one.

## Alternatives

### Cloudflare R2 (ADR 0002)

Remains a viable S3-compatible option with a larger free allowance (10 GB) and
free egress, but is no longer preferred now that Tigris meets the same
requirements. Switching back requires only storage configuration.

### Bunny Storage

Attractive for its CDN and related services, but its S3 API is in preview with
creation-time-only enablement and metadata limits, and it has no free tier.
Reconsider if its S3 API becomes generally available or if CDN features become
necessary.

### Cloudflare Images and Ente

Rejected: paid hosted service and non-public encrypted backup, respectively.

## Image processing defaults

Initial values live in `apps/admin/src/photos/processing.ts` and are
implementation choices, not part of this decision. Change them there and update
the tests in `apps/admin/tests/photo-processing.test.tsx`:

- `PHOTO_VARIANT_WIDTHS`: output widths (480, 960, 1600 px); sources are never
  upscaled.
- `MAX_UPLOAD_BYTES` (10 MB) and `MAX_INPUT_PIXELS` (50 million): upload limits.
- `ALLOWED_FORMATS`: accepted input formats (JPEG, PNG, WebP).
- The `.webp({ quality: 80 })` call: output format and quality. Changing the
  format also requires updating `photoObjectKey` in
  `apps/admin/src/photos/storage.ts` and the content type in `PhotoVariant`.

## Vercel request-size limit

Vercel's function limits page (checked 2026-11-20) caps request bodies at
4.5 MB and answers larger ones with 413 `FUNCTION_PAYLOAD_TOO_LARGE` before our
code runs. Function memory (2 GB Hobby) and duration (300 s) are enough for
sharp; bundle size with sharp's binaries is unverified until a deployment.
The editor therefore shrinks images over 4 MB in the browser before upload
(`apps/admin/src/editor/photo-downscale.ts`): long edge 2400, 1800, then
1200 px as JPEG at quality 0.85, flattened onto white. `UPLOAD_BODY_LIMIT_BYTES`
and `LONG_EDGES` there are the tuning points. The server's 10 MB cap and full
processing still apply. If a host without this limit is used later, or a
presigned direct upload is adopted, the downscaling can be removed.

## Public delivery

The public detail page builds image URLs as `VITE_PUBLIC_PHOTO_BASE_URL` plus
the published variant key (`apps/public/src/public-photos.ts`). The setting is
a build-time HTTPS origin, not a secret, so it can point at the Tigris public
bucket or a custom domain and be changed without a code change. Photos are
omitted, and the rest of the page still renders, when it is unset. Keys that do
not match `photos/<id>/<width>.webp` are ignored.

Uploads and drafts stay in a private bucket. After the publication records are
saved, the admin server copies the published variants to a separate public
bucket using S3 CopyObject. This ordering avoids copying a draft from a failed
publication, but a copy failure leaves the shop published with missing images.
The editor reports that state and provides a retry for the published snapshot.
Copies may partially succeed; retries repeat the copy. A successful copy does
not prove that a later regeneration or deployment completed.

## Consequences

- Dependencies added for #72, both server-only in the admin app: `sharp`
  (upload-time resizing; Apache-2.0, native libvips binaries, subject to
  Vercel function size and memory limits; replaceable by any image library
  behind `processPhoto`) and `@aws-sdk/client-s3` (standard S3 client used
  in `storage-s3.ts` and `delivery-s3.ts`; replaceable by an S3-compatible
  client behind the storage and delivery interfaces). Neither has recurring
  cost.
- Update #72 and launch checks to reference Tigris rather than R2.
- Keep the upload bucket private and use a separate public delivery bucket.
  Use the Tigris public bucket hostname first; defer a custom domain until the
  public app has a stable production hostname and the bucket is verified.
- Copy published variants with `Cache-Control: public, max-age=3600`. A one-hour
  cache limits stale responses but cannot revoke downloaded copies.
- Use a bucket with no dots in its name unless a custom domain is configured,
  because public bucket domains do not support them.
- The application does not retain original uploads after processing. Draft
  saves attempt to delete removed private variants only if no published copy
  references them; failed deletions can leave orphans. Public objects are not
  automatically removed on replacement or unpublication and can remain
  accessible by URL. The owner manually removes obsolete public objects in the
  Tigris console after checking published references and deployed pages, as
  described in the README. Pause publication and delivery retries during the
  check and deletion. Rehearse cleanup and recovery before launch; export Atlas
  records and both buckets to a separate operator-controlled backup location,
  because object storage alone is not a backup.
- Processing runtime, image dimensions/formats, and Vercel compute, memory, and
  upload limits remain implementation-time decisions per ADR 0002 and
  [ADR 0006](0006-vercel-prerendered-hosting.md).
- Recheck pricing and terms before deployment and monitor usage.

## References

- [Tigris pricing](https://www.tigrisdata.com/pricing/)
- [Tigris public buckets](https://www.tigrisdata.com/docs/buckets/public-bucket.md)
- [Tigris overview](https://www.tigrisdata.com/docs/overview.md)
- [Bunny Storage pricing](https://bunny.net/pricing/storage/)
- [Bunny Storage S3 API](https://bunny.net/docs/storage/s3.md)
