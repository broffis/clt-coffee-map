import { validateHttpsUrl, validateOptionalText } from "./validation";

export interface ContactLinks {
  readonly website: string | null;
  readonly other: readonly {
    readonly label: string;
    readonly url: string;
  }[];
}

export function validateContactLinks(links: ContactLinks | null): void {
  if (links === null) {
    return;
  }

  if (links.website !== null) {
    validateHttpsUrl(links.website, "Website URL");
  }

  const labels = new Set<string>();
  for (const link of links.other) {
    validateOptionalText(link.label, "Link label");
    validateHttpsUrl(link.url, "Link URL");
    if (labels.has(link.label)) {
      throw new RangeError("Link labels must not contain duplicates.");
    }
    labels.add(link.label);
  }
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
