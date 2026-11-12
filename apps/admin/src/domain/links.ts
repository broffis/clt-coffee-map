export interface ContactLinks {
  readonly website: string | null;
  readonly other: readonly {
    readonly label: string;
    readonly url: string;
  }[];
}

export function copyContactLinks(
  links: ContactLinks | null,
): ContactLinks | null {
  if (links === null) {
    return null;
  }

  return {
    website: links.website,
    other: links.other.map((link) => ({ ...link })),
  };
}
