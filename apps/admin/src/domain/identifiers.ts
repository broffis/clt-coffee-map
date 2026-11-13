export function validateIdentifier(id: string, field: string): void {
  if (id.trim().length === 0) {
    throw new RangeError(`${field} must not be blank.`);
  }
}
