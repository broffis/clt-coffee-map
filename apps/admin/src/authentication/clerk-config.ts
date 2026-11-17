export function readAuthorizedParties(
  env: Readonly<Record<string, string | undefined>>,
): string[] {
  const origin = env.ADMIN_ORIGIN;
  if (origin === undefined && env.NODE_ENV === "development") {
    return ["http://127.0.0.1:3001", "http://localhost:3001"];
  }
  if (origin !== undefined && URL.canParse(origin)) {
    const url = new URL(origin);
    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.origin === origin
    ) {
      return [origin];
    }
  }
  throw new Error("ADMIN_ORIGIN must be an HTTP(S) origin.");
}
