# 0002: Use Cloudflare R2 and resize photos at upload

## Status

Accepted on 2026-11-09. Related work: [#51](https://github.com/broffis/clt-coffee-map/issues/51).

## Context

The directory needs shop photos stored separately from MongoDB Atlas.
Priorities are low ongoing cost and exportable media, with free tiers preferred
where practical and recurring costs discussed before proceeding.

Cloudinary combines storage, transformations, and delivery. R2 provides
S3-compatible object storage but requires us to implement image processing.
The R2 free allowance and usage-based pricing offer a more gradual cost path
than Cloudinary's published free-to-paid plan transition.

## Decision

Use Cloudflare R2 Standard storage for MVP shop photos.

Resize images during the upload workflow and store web-ready variants in R2.
Complete processing before making a photo available for publication; do not
rely on resizing at visitor request time or serve oversized uploads as the
normal discovery images. Surface processing failures to the administrator
rather than treating a failed upload as ready.

Authorize uploads through server operations that verify the Clerk session
and explicit admin permission. Validate uploaded file types and sizes, keep
storage credentials server-side, and keep unprocessed uploads private.

Store stable photo IDs and object references in Atlas rather than image
bytes. Keep media exportable and the application independent of
provider-specific transformation URLs.

Select target dimensions, output formats, processing tooling/runtime, and
original-file retention when designing the upload workflow. R2 selection
does not select the application host or require Cloudflare Images.

Image-processing details, original retention, delivery/cache behavior,
replacement/deletion, and export/recovery are implementation-time decisions,
not prerequisites to starting development. Resolve and validate them while
building the upload and delivery flows, before launch.

This decision does not provision a bucket, enable paid services, or authorize
recurring costs.

## Alternatives

### Cloudinary

Provides integrated upload management, optimization, transformations, and CDN
delivery, reducing implementation work. Its shared credit allowance combines
storage, processing, and delivery usage, and the published paid-plan entry
price is a larger cost step than R2's metered storage and operations. Choose
R2 despite the additional upload-processing work.

### R2 with request-time Cloudflare Images transformations

Can transform images stored in R2, but introduces a separate service and
transformation allowance. The free plan rejects new transformations after
its monthly limit. Upload-time resizing avoids depending on that allowance
for the MVP discovery images.

## Consequences

- Implement and test resizing, upload validation, processing failure handling,
  and publication readiness as part of the private admin workflow.
- Choose a processing runtime that supports the selected image tools; account
  for its compute, memory, and upload limits separately from R2 storage costs.
- R2 Standard currently includes 10 GB-month storage, one million Class A
  operations, and ten million Class B operations per month. Direct R2 egress
  is free; processing, hosting, and connected services may charge separately.
  Recheck pricing before deployment and monitor usage.
- Define public image delivery and cache behavior without exposing private
  uploads or drafts. Hosting/CDN and domain configuration remain to be decided.
- Define original-file retention, replacement/deletion behavior, and media
  export and recovery before launch; object storage alone is not a backup.

## References

Provider documentation reviewed on 2026-11-09; plans and features may change.

- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudinary pricing](https://cloudinary.com/pricing)
- [Cloudflare Images pricing and transformation limits](https://developers.cloudflare.com/images/pricing/)
