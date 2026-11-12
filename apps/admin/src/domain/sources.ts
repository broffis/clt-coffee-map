export interface SourceReference<Field extends string> {
  readonly name: string;
  readonly url: string | null;
  readonly recordId: string | null;
  readonly release: string | null;
  readonly license: string | null;
  readonly verifiedOn: string | null;
  readonly fields: readonly Field[];
}

export function copySources<Field extends string>(
  sources: readonly SourceReference<Field>[] | null,
): readonly SourceReference<Field>[] | null {
  return sources === null
    ? null
    : sources.map((source) => ({ ...source, fields: [...source.fields] }));
}
