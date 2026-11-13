import {
  validateHttpsUrl,
  validateOptionalText,
  validateVerifiedDate,
} from "./validation";

export interface SourceReference<Field extends string> {
  readonly name: string;
  readonly url: string | null;
  readonly recordId: string | null;
  readonly release: string | null;
  readonly license: string | null;
  readonly verifiedOn: string | null;
  readonly fields: readonly Field[];
}

export function validateSources<Field extends string>(
  sources: readonly SourceReference<Field>[] | null,
  allowedFields: readonly Field[],
): void {
  if (sources === null) {
    return;
  }

  const allowed = new Set(allowedFields);
  for (const source of sources) {
    if (source.name.trim().length === 0) {
      throw new RangeError("Source name must not be blank.");
    }
    if (source.url !== null) {
      validateHttpsUrl(source.url, "Source URL");
    }
    validateOptionalText(source.recordId, "Source record ID");
    validateOptionalText(source.release, "Source release");
    validateOptionalText(source.license, "Source license");
    if (source.verifiedOn !== null) {
      validateVerifiedDate(source.verifiedOn, "Source verification date");
    }
    if (source.fields.length === 0) {
      throw new RangeError("A source must identify at least one field.");
    }

    const fields = new Set<string>();
    for (const field of source.fields) {
      if (!allowed.has(field)) {
        throw new RangeError(`Unsupported source field: ${field}.`);
      }
      if (fields.has(field)) {
        throw new RangeError("Source fields must not contain duplicates.");
      }
      fields.add(field);
    }
  }
}

export function copySources<Field extends string>(
  sources: readonly SourceReference<Field>[] | null,
): readonly SourceReference<Field>[] | null {
  return sources === null
    ? null
    : sources.map((source) => ({ ...source, fields: [...source.fields] }));
}
