export interface PublicRegenerationRequest {
  readonly action: "publish-location" | "unpublish-location" | "republish-shop";
  readonly shopId: string;
  readonly locationId?: string;
}

export class PublicRegenerationError extends Error {
  constructor() {
    super("The public update could not be triggered.");
    this.name = "PublicRegenerationError";
  }
}

export interface PublicRegenerationTrigger {
  trigger(request: PublicRegenerationRequest): Promise<void>;
}

function readWebhookUrl(
  env: Readonly<Record<string, string | undefined>>,
): URL {
  const value = env.PUBLIC_REGENERATION_WEBHOOK_URL?.trim() ?? "";
  if (value === "") {
    throw new PublicRegenerationError();
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new PublicRegenerationError();
  }
  if (url.protocol !== "https:") {
    throw new PublicRegenerationError();
  }
  return url;
}

export function createPublicRegenerationTrigger(
  env: Readonly<Record<string, string | undefined>>,
): PublicRegenerationTrigger {
  return {
    async trigger(request) {
      const url = readWebhookUrl(env);
      const secret = env.PUBLIC_REGENERATION_WEBHOOK_SECRET?.trim() ?? "";
      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(secret === ""
              ? {}
              : { "X-Public-Regeneration-Secret": secret }),
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        throw new PublicRegenerationError();
      }
      if (!response.ok) {
        throw new PublicRegenerationError();
      }
    },
  };
}
