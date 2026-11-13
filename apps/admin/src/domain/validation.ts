export function validateHttpsUrl(value: string, label: string): void {
  if (!URL.canParse(value) || new URL(value).protocol !== "https:") {
    throw new RangeError(`${label} must be a valid HTTPS URL.`);
  }
}

export function validateOptionalText(
  value: string | null,
  label: string,
): void {
  if (value !== null && value.trim().length === 0) {
    throw new RangeError(`${label} must not be blank.`);
  }
}

export function validateVerifiedDate(value: string, label: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RangeError(`${label} must be a valid calendar date.`);
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (
    Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new RangeError(`${label} must be a valid calendar date.`);
  }

  if (value > new Date().toISOString().slice(0, 10)) {
    throw new RangeError(`${label} cannot be in the future.`);
  }
}

export function validateUniqueNonBlankValues(
  values: readonly string[],
  label: string,
): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (value.trim().length === 0) {
      throw new RangeError(`${label} must not contain blank values.`);
    }
    if (seen.has(value)) {
      throw new RangeError(`${label} must not contain duplicates.`);
    }
    seen.add(value);
  }
}
